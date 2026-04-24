/**
 * HIS (Hospital Information System) read-only query layer.
 *
 * ALL functions:
 *   - Return null if the record is not found or HIS is offline — never throw.
 *   - Log query time to stdout for performance monitoring.
 *   - Cache results for 5 minutes (HIS data changes slowly).
 *
 * ⚠ COLUMN NAME ASSUMPTIONS — every assumption is marked ⚠ below.
 *   Verify each column name against the actual HIS schema before deploying.
 *   Common discrepancies to check:
 *     • PatientName  → may be split into FirstName + LastName (or Title/FirstName/LastName)
 *     • PatientID    → may be named AdmitNo, RegNo, HospitalNo, or MRN
 *     • DOB          → may be DateOfBirth or BirthDate
 *     • ContactNo    → may be MobileNo, Tel, Phone1
 *     • InsurerCode  → may be InsuranceCode, CompanyCode, or a lookup FK
 *     • RoomType     → may be RoomClass, WardClass, BedClass
 *     • IsPrimary    → may be PrimaryFlag, DiagType, or implied by row order
 *     • SignatureURL → may not exist; SignatureData may be VARBINARY not VARCHAR
 */

import { getHisPool } from './his-db'

// ─── 5-minute in-memory cache ────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry<T> { value: T; expiresAt: number }
const _cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | undefined {
  const entry = _cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return undefined }
  return entry.value
}

function setCached<T>(key: string, value: T): void {
  _cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

async function cachedQuery<T>(
  cacheKey: string,
  fn: () => Promise<T | null>,
): Promise<T | null> {
  const hit = getCached<T>(cacheKey)
  if (hit !== undefined) return hit

  const start = Date.now()
  try {
    const result = await fn()
    console.log(`[HIS] ${cacheKey} — ${Date.now() - start}ms`)
    setCached(cacheKey, result)
    return result
  } catch (err) {
    console.error(`[HIS] Query failed (${cacheKey}):`, err)
    return null
  }
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface HisPatient {
  patientId:     string
  fullName:      string
  dob:           string   // ISO date string YYYY-MM-DD
  nric:          string
  address:       string
  contactNumber: string
}

export interface HisInsurance {
  policyNumber: string
  memberId:     string
  insurerCode:  string
  groupCode:    string
}

export interface HisDoctor {
  fullName:   string
  mmcNumber:  string
  specialty:  string
  department: string
}

export interface HisSignature {
  signatureUrl:  string | null
  signatureData: string | null  // base64 data-URI or raw URL
}

export interface HisAdmission {
  admissionDate:         string
  expectedDischargeDate: string | null
  wardCode:              string
  roomType:              string
}

export interface HisDiagnosis {
  diagnosisCode:        string
  diagnosisDescription: string
  isPrimary:            boolean
}

export interface HisPatientSearchResult {
  patientId: string
  fullName:  string
  dob:       string
  nric:      string
}

// ─── Query functions ──────────────────────────────────────────────────────────

/**
 * Look up a patient by NRIC.
 * ⚠ ASSUMPTION: CPIPersonal.NRIC is the correct column name and is indexed.
 * ⚠ ASSUMPTION: PatientName holds the full name as a single string.
 * ⚠ ASSUMPTION: PatientID is the primary key used to join other tables.
 */
export async function getPatientByNRIC(nric: string): Promise<HisPatient | null> {
  return cachedQuery(`patient:nric:${nric}`, async () => {
    const pool = await getHisPool()
    if (!pool) return null

    const result = await pool.request()
      .input('nric', nric)
      .query<{
        patientId:     string
        fullName:      string
        dob:           Date | null
        nric:          string
        address:       string | null
        contactNumber: string | null
      }>(`
        SELECT
          PatientID   AS patientId,
          PatientName AS fullName,
          DOB         AS dob,
          NRIC        AS nric,
          Address     AS address,
          ContactNo   AS contactNumber
        FROM CPIPersonal
        WHERE NRIC = @nric
      `)

    if (!result.recordset.length) return null
    const r = result.recordset[0]
    return {
      patientId:     String(r.patientId   ?? ''),
      fullName:      r.fullName           ?? '',
      dob:           r.dob ? r.dob.toISOString().split('T')[0] : '',
      nric:          r.nric               ?? nric,
      address:       r.address            ?? '',
      contactNumber: r.contactNumber      ?? '',
    }
  })
}

/**
 * Retrieve insurance details for a patient.
 * ⚠ ASSUMPTION: CPIInsurance.PatientID matches CPIPersonal.PatientID.
 * ⚠ ASSUMPTION: The most recent row (ORDER BY CreatedAt DESC) is the active policy.
 * ⚠ ASSUMPTION: InsurerCode values match the insurer codes used in GOP (APRIL, HSC, LUMA, AIA, ASSURNET).
 */
export async function getPatientInsurance(patientId: string): Promise<HisInsurance | null> {
  return cachedQuery(`insurance:${patientId}`, async () => {
    const pool = await getHisPool()
    if (!pool) return null

    const result = await pool.request()
      .input('patientId', patientId)
      .query<{
        policyNumber: string | null
        memberId:     string | null
        insurerCode:  string | null
        groupCode:    string | null
      }>(`
        SELECT TOP 1
          PolicyNo    AS policyNumber,
          MemberID    AS memberId,
          InsurerCode AS insurerCode,
          GroupCode   AS groupCode
        FROM CPIInsurance
        WHERE PatientID = @patientId
        ORDER BY CreatedAt DESC
      `)

    if (!result.recordset.length) return null
    const r = result.recordset[0]
    return {
      policyNumber: r.policyNumber ?? '',
      memberId:     r.memberId     ?? '',
      insurerCode:  r.insurerCode  ?? '',
      groupCode:    r.groupCode    ?? '',
    }
  })
}

/**
 * Look up a doctor by MMC registration number.
 * ⚠ ASSUMPTION: Doctors.MMCNumber is the correct column and is unique.
 * ⚠ ASSUMPTION: DoctorName is a single full-name string (not Title+First+Last).
 */
export async function getDoctorByMMC(mmcNumber: string): Promise<HisDoctor | null> {
  return cachedQuery(`doctor:${mmcNumber}`, async () => {
    const pool = await getHisPool()
    if (!pool) return null

    const result = await pool.request()
      .input('mmcNumber', mmcNumber)
      .query<{
        fullName:   string | null
        mmcNumber:  string | null
        specialty:  string | null
        department: string | null
      }>(`
        SELECT
          DoctorName AS fullName,
          MMCNumber  AS mmcNumber,
          Specialty  AS specialty,
          Department AS department
        FROM Doctors
        WHERE MMCNumber = @mmcNumber
      `)

    if (!result.recordset.length) return null
    const r = result.recordset[0]
    return {
      fullName:   r.fullName   ?? '',
      mmcNumber:  r.mmcNumber  ?? mmcNumber,
      specialty:  r.specialty  ?? '',
      department: r.department ?? '',
    }
  })
}

/**
 * Retrieve the doctor's digital signature from DoctorSignatures.
 * ⚠ ASSUMPTION: DoctorSignatures.DoctorID matches the user's ID from the Microsoft Entra session.
 *   If DoctorID is an internal HIS integer key, a mapping table is needed.
 * ⚠ ASSUMPTION: SignatureURL is a VARCHAR URL string pointing to stored file.
 * ⚠ ASSUMPTION: SignatureData is either a base64 string or VARBINARY — both are handled below.
 */
export async function getDoctorSignature(doctorId: string): Promise<HisSignature | null> {
  return cachedQuery(`signature:${doctorId}`, async () => {
    const pool = await getHisPool()
    if (!pool) return null

    const result = await pool.request()
      .input('doctorId', doctorId)
      .query<{
        signatureUrl:  string | null
        signatureData: Buffer | string | null
      }>(`
        SELECT
          SignatureURL  AS signatureUrl,
          SignatureData AS signatureData
        FROM DoctorSignatures
        WHERE DoctorID = @doctorId
      `)

    if (!result.recordset.length) return null
    const r = result.recordset[0]

    // Convert VARBINARY to a usable base64 data-URI if needed
    let signatureData: string | null = null
    if (r.signatureData) {
      if (Buffer.isBuffer(r.signatureData)) {
        signatureData = `data:image/png;base64,${r.signatureData.toString('base64')}`
      } else {
        signatureData = String(r.signatureData)
      }
    }

    return {
      signatureUrl:  r.signatureUrl ?? null,
      signatureData,
    }
  })
}

/**
 * Retrieve admission details for a given admission ID.
 * ⚠ ASSUMPTION: AdmitRegister.AdmissionID is the correct PK column name.
 * ⚠ ASSUMPTION: RoomType values match ASSURNET questionnaire options (e.g. 'Standard', 'Deluxe', 'ICU').
 * ⚠ ASSUMPTION: ExpectedDischargeDate is nullable (not yet set at admission time).
 */
export async function getAdmission(admissionId: string): Promise<HisAdmission | null> {
  return cachedQuery(`admission:${admissionId}`, async () => {
    const pool = await getHisPool()
    if (!pool) return null

    const result = await pool.request()
      .input('admissionId', admissionId)
      .query<{
        admissionDate:         Date | null
        expectedDischargeDate: Date | null
        wardCode:              string | null
        roomType:              string | null
      }>(`
        SELECT
          AdmitDate             AS admissionDate,
          ExpectedDischargeDate AS expectedDischargeDate,
          WardCode              AS wardCode,
          RoomType              AS roomType
        FROM AdmitRegister
        WHERE AdmissionID = @admissionId
      `)

    if (!result.recordset.length) return null
    const r = result.recordset[0]
    return {
      admissionDate:         r.admissionDate         ? r.admissionDate.toISOString().split('T')[0]         : '',
      expectedDischargeDate: r.expectedDischargeDate ? r.expectedDischargeDate.toISOString().split('T')[0] : null,
      wardCode:              r.wardCode              ?? '',
      roomType:              r.roomType              ?? '',
    }
  })
}

/**
 * Retrieve all ICD-10 diagnoses for an admission, primary first.
 * ⚠ ASSUMPTION: AdmitDiagnosis.AdmissionID joins to AdmitRegister.AdmissionID.
 * ⚠ ASSUMPTION: IsPrimary is a BIT/TINYINT column (1 = primary, 0 = secondary).
 * ⚠ ASSUMPTION: DiagnosisCode is an ICD-10 code (e.g. 'K35.2', 'I21.0').
 */
export async function getAdmissionDiagnosis(admissionId: string): Promise<HisDiagnosis[] | null> {
  return cachedQuery(`diagnosis:${admissionId}`, async () => {
    const pool = await getHisPool()
    if (!pool) return null

    const result = await pool.request()
      .input('admissionId', admissionId)
      .query<{
        diagnosisCode:        string | null
        diagnosisDescription: string | null
        isPrimary:            number | boolean | null
      }>(`
        SELECT
          DiagnosisCode        AS diagnosisCode,
          DiagnosisDescription AS diagnosisDescription,
          IsPrimary            AS isPrimary
        FROM AdmitDiagnosis
        WHERE AdmissionID = @admissionId
        ORDER BY IsPrimary DESC
      `)

    if (!result.recordset.length) return null
    return result.recordset.map(r => ({
      diagnosisCode:        r.diagnosisCode        ?? '',
      diagnosisDescription: r.diagnosisDescription ?? '',
      isPrimary:            Boolean(r.isPrimary),
    }))
  })
}

/**
 * Search patients by NRIC prefix or name substring.
 * Not cached — results must be fresh per keystroke.
 * ⚠ ASSUMPTION: PatientName and NRIC columns exist in CPIPersonal.
 * ⚠ ASSUMPTION: PatientID is the primary key used in downstream joins (getPatientInsurance, getAdmission).
 */
export async function searchPatients(
  q: string,
): Promise<HisPatientSearchResult[] | null> {
  if (!q || q.length < 2) return []

  const pool = await getHisPool()
  if (!pool) return null

  const start = Date.now()
  try {
    const result = await pool.request()
      .input('nameLike',  `%${q}%`)
      .input('nricLike',  `${q}%`)
      .query<{
        patientId: string | number
        fullName:  string | null
        dob:       Date | null
        nric:      string | null
      }>(`
        SELECT TOP 10
          PatientID   AS patientId,
          PatientName AS fullName,
          DOB         AS dob,
          NRIC        AS nric
        FROM CPIPersonal
        WHERE PatientName LIKE @nameLike
           OR NRIC        LIKE @nricLike
        ORDER BY PatientName
      `)

    console.log(`[HIS] searchPatients("${q}") — ${Date.now() - start}ms, ${result.recordset.length} rows`)
    return result.recordset.map(r => ({
      patientId: String(r.patientId ?? ''),
      fullName:  r.fullName ?? '',
      dob:       r.dob ? r.dob.toISOString().split('T')[0] : '',
      nric:      r.nric ?? '',
    }))
  } catch (err) {
    console.error('[HIS] searchPatients failed:', err)
    return null
  }
}

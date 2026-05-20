import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const HUBSPOT_BASE_URL = "https://api.hubapi.com";

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const CSV_FILE_PATH = process.env.CSV_FILE_PATH;

const CONTACT_OBJECT_TYPE_ID = process.env.CONTACT_OBJECT_TYPE_ID;
const MEMBERSHIP_OBJECT_TYPE_ID = process.env.MEMBERSHIP_OBJECT_TYPE_ID;

const CONTACT_UNIQUE_PROPERTY = process.env.CONTACT_UNIQUE_PROPERTY || "email";
const MEMBERSHIP_UNIQUE_PROPERTY = process.env.MEMBERSHIP_UNIQUE_PROPERTY || "member_id";

const ASSOCIATION_CATEGORY = process.env.ASSOCIATION_CATEGORY || "USER_DEFINED";
const CONTACT_TO_MEMBERSHIP_ASSOCIATION_TYPE_ID = Number(
  process.env.CONTACT_TO_MEMBERSHIP_ASSOCIATION_TYPE_ID
);

const OBJECT_BATCH_SIZE = Number(process.env.OBJECT_BATCH_SIZE || 100);
const ASSOCIATION_BATCH_SIZE = Number(process.env.ASSOCIATION_BATCH_SIZE || 1000);

const requiredEnv = [
  "HUBSPOT_ACCESS_TOKEN",
  "CSV_FILE_PATH",
  "CONTACT_OBJECT_TYPE_ID",
  "MEMBERSHIP_OBJECT_TYPE_ID",
  "CONTACT_TO_MEMBERSHIP_ASSOCIATION_TYPE_ID"
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing .env value: ${key}`);
  }
}

if (!Number.isFinite(CONTACT_TO_MEMBERSHIP_ASSOCIATION_TYPE_ID)) {
  throw new Error("CONTACT_TO_MEMBERSHIP_ASSOCIATION_TYPE_ID must be a number");
}

const columnMappings = [
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "Email",
    propertyName: "email",
    columnType: "HUBSPOT_ALTERNATE_ID"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "First Name",
    propertyName: "firstname"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "Last Name",
    propertyName: "lastname"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "Phone Number",
    propertyName: "phone"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "City",
    propertyName: "city"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "Country/Region",
    propertyName: "country"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "State/Region",
    propertyName: "state"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "Postal Code",
    propertyName: "zip"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "LinkedIn URL",
    propertyName: "hs_linkedin_url"
  },
  {
    columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
    columnName: "Annual Revenue",
    propertyName: "annualrevenue"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Record ID",
    propertyName: "member_id",
    columnType: "HUBSPOT_ALTERNATE_ID"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Membership Name",
    propertyName: "membership_name"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "CC Membership Agreement",
    propertyName: "cc_membership_agreement"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Community Date Joined",
    propertyName: "community_date_joined"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Community Access Revoked",
    propertyName: "community_access_revoked"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Cohort Start Date",
    propertyName: "cohort_start_date"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Community Expiration Date",
    propertyName: "community_expiration_date"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Latest Renewal Date",
    propertyName: "latest_renewal_date"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Community Course Purchase",
    propertyName: "community_course_purchase"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Community Renewal Price",
    propertyName: "community_renewal_price"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Member Initial Roadblock",
    propertyName: "member_initial_roadblock"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Community Employment Status",
    propertyName: "community_employment_status"
  },
  {
    columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
    columnName: "Community Slack ID",
    propertyName: "community_slack_id"
  }
];

const DATE_PROPERTIES = new Set([
  "community_date_joined",
  "cohort_start_date",
  "community_expiration_date",
  "latest_renewal_date"
]);

const BOOLEAN_PROPERTIES = new Set([
  "community_course_purchase",
  "community_access_revoked"
]);

function chunkArray(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

function cleanValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function convertDateToEpochMs(value) {
  const clean = cleanValue(value);

  if (!clean) return "";

  if (/^\d{13}$/.test(clean)) {
    return clean;
  }

  let match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (match) {
    const [, year, month, day] = match;
    return String(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (match) {
    const [, month, day, year] = match;
    return String(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  throw new Error(`Invalid date format: ${clean}`);
}

function convertBoolean(value) {
  const clean = cleanValue(value).toLowerCase();

  if (!clean) return "";
  if (["yes", "y", "true", "1"].includes(clean)) return "true";
  if (["no", "n", "false", "0"].includes(clean)) return "false";

  throw new Error(`Invalid boolean value: ${value}`);
}

function buildProperties(row, objectTypeId) {
  const properties = {};

  for (const mapping of columnMappings) {
    if (mapping.columnObjectTypeId !== objectTypeId) continue;

    let value = cleanValue(row[mapping.columnName]);

    if (value === "") continue;

    if (DATE_PROPERTIES.has(mapping.propertyName)) {
      value = convertDateToEpochMs(value);
    }

    if (BOOLEAN_PROPERTIES.has(mapping.propertyName)) {
      value = convertBoolean(value);
    }

    properties[mapping.propertyName] = value;
  }

  return properties;
}

function readCsv() {
  const absolutePath = path.resolve(CSV_FILE_PATH);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const csv = fs.readFileSync(absolutePath, "utf8");

  return parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });
}

async function hubspotRequest(endpoint, options = {}, attempt = 1) {
  const response = await fetch(`${HUBSPOT_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const retryableStatus = [429, 500, 502, 503, 504];

    if (retryableStatus.includes(response.status) && attempt <= 5) {
      const delayMs = 1000 * attempt * 2;
      console.log(`Retrying ${endpoint}, attempt ${attempt}, wait ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return hubspotRequest(endpoint, options, attempt + 1);
    }

    throw new Error(
      `HubSpot API error ${response.status} on ${endpoint}\n${JSON.stringify(data, null, 2)}`
    );
  }

  return data;
}

function prepareRecords(rows) {
  const contactsMap = new Map();
  const membershipsMap = new Map();
  const associationsMap = new Map();

  let skippedRows = 0;

  for (const row of rows) {
    const email = cleanValue(row["Email"]).toLowerCase();
    const memberId = cleanValue(row["Record ID"]);

    if (!email || !memberId) {
      skippedRows++;
      continue;
    }

    const contactProperties = buildProperties(row, CONTACT_OBJECT_TYPE_ID);
    const membershipProperties = buildProperties(row, MEMBERSHIP_OBJECT_TYPE_ID);

    contactsMap.set(email, {
      id: email,
      idProperty: CONTACT_UNIQUE_PROPERTY,
      properties: contactProperties
    });

    membershipsMap.set(memberId, {
      id: memberId,
      idProperty: MEMBERSHIP_UNIQUE_PROPERTY,
      properties: membershipProperties
    });

    associationsMap.set(`${email}---${memberId}`, {
      contactUniqueValue: email,
      membershipUniqueValue: memberId
    });
  }

  return {
    contacts: Array.from(contactsMap.values()),
    memberships: Array.from(membershipsMap.values()),
    associations: Array.from(associationsMap.values()),
    skippedRows
  };
}

async function batchUpsertObjects(objectTypeId, records, label) {
  const chunks = chunkArray(records, OBJECT_BATCH_SIZE);

  console.log(`\n${label} upsert started: ${records.length} records`);

  for (let i = 0; i < chunks.length; i++) {
    const payload = {
      inputs: chunks[i]
    };

    await hubspotRequest(
      `/crm/v3/objects/${encodeURIComponent(objectTypeId)}/batch/upsert`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    console.log(`${label} batch ${i + 1}/${chunks.length} completed`);
  }
}

async function batchReadIds(objectTypeId, uniqueProperty, uniqueValues, label) {
  const chunks = chunkArray(uniqueValues, OBJECT_BATCH_SIZE);
  const idMap = new Map();

  console.log(`\n${label} ID read started: ${uniqueValues.length} records`);

  for (let i = 0; i < chunks.length; i++) {
    const payload = {
      idProperty: uniqueProperty,
      properties: [uniqueProperty],
      inputs: chunks[i].map((value) => ({
        id: value
      }))
    };

    const result = await hubspotRequest(
      `/crm/v3/objects/${encodeURIComponent(objectTypeId)}/batch/read`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    for (const item of result.results || []) {
      const uniqueValue = item.properties?.[uniqueProperty];

      if (uniqueValue) {
        idMap.set(String(uniqueValue), String(item.id));
        idMap.set(String(uniqueValue).toLowerCase(), String(item.id));
      }
    }

    console.log(`${label} ID read batch ${i + 1}/${chunks.length} completed`);
  }

  return idMap;
}

async function batchCreateAssociations(associations, contactIdMap, membershipIdMap) {
  const inputs = [];
  const missing = [];

  for (const association of associations) {
    const contactId = contactIdMap.get(association.contactUniqueValue);
    const membershipId = membershipIdMap.get(association.membershipUniqueValue);

    if (!contactId || !membershipId) {
      missing.push(association);
      continue;
    }

    inputs.push({
      from: {
        id: contactId
      },
      to: {
        id: membershipId
      },
      types: [
        {
          associationCategory: ASSOCIATION_CATEGORY,
          associationTypeId: CONTACT_TO_MEMBERSHIP_ASSOCIATION_TYPE_ID
        }
      ]
    });
  }

  if (missing.length > 0) {
    fs.writeFileSync("missing-associations.json", JSON.stringify(missing, null, 2));
    console.log(`Missing associations saved: ${missing.length}`);
  }

  const chunks = chunkArray(inputs, ASSOCIATION_BATCH_SIZE);

  console.log(`\nAssociation create started: ${inputs.length} associations`);

  for (let i = 0; i < chunks.length; i++) {
    const payload = {
      inputs: chunks[i]
    };

    await hubspotRequest(
      `/crm/v4/associations/${encodeURIComponent(CONTACT_OBJECT_TYPE_ID)}/${encodeURIComponent(
        MEMBERSHIP_OBJECT_TYPE_ID
      )}/batch/create`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    console.log(`Association batch ${i + 1}/${chunks.length} completed`);
  }
}

async function main() {
  const rows = readCsv();

  console.log(`CSV rows: ${rows.length}`);

  const { contacts, memberships, associations, skippedRows } = prepareRecords(rows);

  console.log(`Contacts prepared: ${contacts.length}`);
  console.log(`Memberships prepared: ${memberships.length}`);
  console.log(`Associations prepared: ${associations.length}`);
  console.log(`Skipped rows: ${skippedRows}`);

  await batchUpsertObjects(CONTACT_OBJECT_TYPE_ID, contacts, "Contact");
  await batchUpsertObjects(MEMBERSHIP_OBJECT_TYPE_ID, memberships, "Membership");

  const contactIdMap = await batchReadIds(
    CONTACT_OBJECT_TYPE_ID,
    CONTACT_UNIQUE_PROPERTY,
    contacts.map((item) => item.id),
    "Contact"
  );

  const membershipIdMap = await batchReadIds(
    MEMBERSHIP_OBJECT_TYPE_ID,
    MEMBERSHIP_UNIQUE_PROPERTY,
    memberships.map((item) => item.id),
    "Membership"
  );

  await batchCreateAssociations(associations, contactIdMap, membershipIdMap);

  console.log("\nDone");
}

main().catch((error) => {
  console.error("\nFailed");
  console.error(error.message);
  process.exit(1);
});
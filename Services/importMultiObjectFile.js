import 'dotenv/config';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
const CONTACT_OBJECT_TYPE_ID = "0-1";
const MEMBERSHIP_OBJECT_TYPE_ID = process.env.MEMBERSHIP_OBJECT_TYPE_ID;
const ASSOCIATION_TYPE_ID = process.env.ASSOCIATION_TYPE_ID;
const importRequest = {
  name: 'Contact-Membership Import',
  files: [{
    fileName: 'Academy_Current_Members_Exported.csv',
    fileFormat: 'CSV',
    fileImportPage: {
      hasHeader: true,
      columnMappings: [
            {
              columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
              columnName: "Email",
              propertyName: "email",
              //columnType: "HUBSPOT_ALTERNATE_ID"
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
              columnName: "Record ID",
              propertyName: "member_id",
              columnType: "HUBSPOT_ALTERNATE_ID"
            },

            {
              columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
              columnName: "LinkedIn URL",
              propertyName: "hs_linkedin_url",
              //columnType: "HUBSPOT_ALTERNATE_ID"
            },
            {
              columnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
              columnName: "Annual Revenue",
              propertyName: "annualrevenue",
              //columnType: "HUBSPOT_ALTERNATE_ID"
            },

            // {
            //   columnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
            //   columnName: "Record ID",
            //   propertyName: "member_id",
            //   columnType: "HUBSPOT_ALTERNATE_ID"
            // },

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
          ]
    }
  }],
  associations: [
    {
      fromColumnObjectTypeId: CONTACT_OBJECT_TYPE_ID,
      fromColumnName: "Record ID",
      toColumnObjectTypeId: MEMBERSHIP_OBJECT_TYPE_ID,
      toColumnName: "Record ID",
      associationTypeId: 45,
    }
  ]
};
// data_files\Academy_Current_Members_Exported.csv

const form = new FormData();
form.append('files', fs.createReadStream('./data_files/Academy_Current_Members_Exported.csv'));
form.append('importRequest', JSON.stringify(importRequest));

const res = await axios.post(
  'https://api.hubapi.com/crm/v3/imports',
  form,
  {
    headers: {
      ...form.getHeaders(), // sets multipart/form-data with boundary
      Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    },
  }
);

console.log(res.data); // contains importId

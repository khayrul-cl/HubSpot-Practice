import "dotenv/config";

const token = process.env.HUBSPOT_ACCESS_TOKEN;
const companyId = process.env.COMPANY_ID;
const properties ={
    firstname: "Khalid",
    lastname: "Hasan",
    email: "khalidhasan2@gmail.com",
    hs_lead_status: "NEW",
    phone: "+8801234567890",
    salary: 987654,
    annualrevenue: 1087654
};
const associations= [
        {
          to: {
            id: companyId,
          },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 279,
            }
          ]
        }
      ]
const options = {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        properties,
        associations
    }),
};

fetch(`https://api.hubapi.com/crm/objects/2026-03/contacts`,options)
.then(async (res)=>{
    const data = await res.json();
    if(!res.ok){
        console.log("API Error:", res.status);
        console.log(data);
        return;
    }
    console.log("Contact created and associated sucessfully!");
    console.log(data);
}) 
.catch(err=>console.log("Request failed: ", err));


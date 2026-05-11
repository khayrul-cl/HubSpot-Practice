import "dotenv/config";

const token = process.env.HUBSPOT_ACCESS_TOKEN;

const contactId = process.env.CONTACT_ID;

const options = {
    method: 'GET',
    headers: {Authorization: `Bearer ${token}`}
};
const properties ={
    fromObjectType: "Contact",
    toObjectType: "Companies",
    objectId: contactId
};
fetch(`https:/api.hubapi.com/crm/objects/2026-03/${properties.fromObjectType}/${properties.objectId}/associations/${properties.toObjectType}`,options)
.then(res=>res.json())
.then(res=>console.log(JSON.stringify(res, null, 2)))
.catch(err=>err);



// console.log("The token is -",properties)



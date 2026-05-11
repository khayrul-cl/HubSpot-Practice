import "dotenv/config";

const token = process.env.HUBSPOT_ACCESS_TOKEN;

const contactId = process.env.CONTACT_ID;

const options = {
    method: 'GET',
    headers: {Authorization: `Bearer ${token}`}
};

const response = fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,options)
.then(res=>res.json())
.then(res=>console.log(res))
.catch(err=>err);



// console.log("The token is -",token)



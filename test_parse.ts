import Papa from 'papaparse';
const csv = `company,name,email,industry,title
Test Co,John Doe,john@test.com,Software,CEO`;

Papa.parse(csv, {
  header: true,
  complete: (res) => console.log(res)
});

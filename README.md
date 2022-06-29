# Calling API to get border crossing times

```javascript
var myHeaders = new Headers();
myHeaders.append("Content-Type", "text/json");
myHeaders.append("Cookie", "TS0152f920=01ff0b0860272a1169dbb8461d1b5e743fc1ce61fbe610bd6c1051155a9d4827c0e7c87dad301285fba85c737dc30bf15b99a26b8c");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://bwt.cbp.gov/api/bwtnew", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

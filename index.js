const fs = require('fs');
const uuidV4 = require('uuid/v4');
const {URL} = require('url');

const filename = process.argv[2];

const auth = {
  type: 'bearer',
  bearer: [{
    key: 'token',
    value: '{{token}}',
    type: 'string'
  }]
};

const info = {
  name: filename,
  _postman_id: uuidV4(),
  description: '',
  schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
};

const getRequestBody = (req) => {
  return req.method === 'GET'
    ? {}
    : {
      mode: 'raw',
      raw: req.postData.text
    };
};

const getRequestHeader = (req) => {
  return req.method === 'GET'
    ? []
    : [{
      key: 'Content-Type',
      value: 'application/json'
    }]
};

const convertHarEntryToPostman = (entry) => {
  const req = entry.request;
  const entryUrl = new URL(req.url);

  const body = getRequestBody(req);
  const header = getRequestHeader(req);
  const paths = entryUrl.pathname.split('/');
  const trimmedPaths = paths.slice(2, paths.length);

  return {
    name: `${req.method} - ${entryUrl.pathname}`,
    request: {
      auth,
      method: req.method,
      header,
      body,
      url: {
        raw: `{{baseurl}}/${trimmedPaths.join('/')}${entryUrl.search}`,
        host: [
          '{{baseurl}}'
        ],
        path: trimmedPaths
      }
    }
  }
};

const harToPostman = (har) => {
  const entries = har.entries.filter(entry => entry.request.method != 'OPTIONS');
  const postmanEntries = entries.map(convertHarEntryToPostman);
  return {
    info,
    item: postmanEntries
  };
};

fs.readFile(filename, function(err, data) {
  if (err) throw err;
  const har = JSON.parse(data);
  const postman = harToPostman(har.log);
  console.log(JSON.stringify(postman, null, 2));
});
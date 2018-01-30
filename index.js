const fs = require('fs');
const uuidV4 = require('uuid/v4');
const {URL} = require('url');
const querystring = require('querystring');

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
  const isOAuth = paths.indexOf('oauth') !== -1;
  const trimmedPaths = paths.slice(2, paths.length);
  const queryObjs = querystring.parse(entryUrl.search);
  const query = Object.keys(queryObjs).map(key => ({
    key: key.replace(/^\?/g, ''), 
    value: queryObjs[key],
    equals: true
  }));

  return {
    name: `${req.method} - ${entryUrl.pathname}`,
    request: {
      auth: !isOAuth && auth,
      method: req.method,
      header,
      body,
      url: {
        raw: `{{baseurl}}/${trimmedPaths.join('/')}${entryUrl.search}`,
        host: [
          '{{baseurl}}'
        ],
        path: trimmedPaths,
        query
      }
    }
  }
};

const harToPostman = (har) => {
  const entries = har.entries.filter(entry => 
    (entry.request.url.indexOf('AIQUIC') !== -1) && 
    (entry.request.method != 'OPTIONS')
  );
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
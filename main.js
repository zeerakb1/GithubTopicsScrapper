const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

let url = "https://github.com/topics";
let jsonData = {};

const getData = (err, res, html) => {
  if (err) {
    console.log(err);
  } else {
    getTopicsData(html);
    // console.log(jsonData)
  }
};

const getTopicsData = (html) => {
  let $ = cheerio.load(html);
  let linkArr = $(".no-underline.d-flex.flex-column.flex-justify-center");
  for (let i = 0; i < linkArr.length; i++) {
    let href = $(linkArr[i]).attr("href");
    let topic = href.split("/topics/")[1];
    let fullLink = `https://github.com${href}`;
    getReposContent(fullLink, topic);
    // console.log(jsonData)
  }
};

const getReposContent = (repoURL, topic) => {
  const getResult = (err, res, html) => {
    if (err) {
      console.error(err);
    } else {
      getRepoLinks(html);
    }
  };

  const getRepoLinks = (html) => {
    let $ = cheerio.load(html);
    let linkArr = $(".Link.text-bold.wb-break-word");
    for (let i = 0; i < 10; i++) {
      let href = $(linkArr[i]).attr("href");
      //   console.log(href.split('/')[1])
      let fullLink = `https://github.com${href}/issues`;
      let repoName = href.split("/")[1];
      getReposIssues(fullLink, topic, repoName);
    }
  };

  request(repoURL, getResult);
};

const getReposIssues = (repoURL, topic, repoName) => {
  const getIssues = (err, res, html) => {
    if (err) {
      console.error(err);
    } else {
      getIssueDtails(html);
      
      const filePath = path.join(__dirname, "data.json");
      
      const appendDataToJsonFile = (filePath, data) => {
        if (fs.existsSync(filePath)) {
          fs.readFile(filePath, "utf8", (err, fileData) => {
            if (err) {
              console.error("An error occurred while reading the file:", err);
              return;
            }
            try {
              const json = JSON.parse(fileData);
              json.push(data); 
              fs.writeFile(filePath, JSON.stringify(json, null, 2), (err) => {
                if (err)
                  console.error(
                    "An error occurred while writing to the file:",
                    err
                  );
                else console.log("Data successfully appended to the file");
              });
            } catch (parseErr) {
              console.error("Error parsing JSON:", parseErr);
            }
          });
        } else {
          fs.writeFile(filePath, JSON.stringify([data], null, 2), (err) => {
            if (err)
              console.error(
                "An error occurred while writing to the file:",
                err
              );
            else console.log("File created and data written successfully");
          });
        }
      }
      appendDataToJsonFile(filePath, jsonData);
    }
  };

  const getIssueDtails = (html) => {
 
    jsonData[topic] = {};
    jsonData[topic][repoName] = [];

    let $ = cheerio.load(html);
    let linkArr = $(
      ".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title"
    );
    let result = [];

    for (let i = 0; i < linkArr.length; i++) {
      let issues = $(linkArr[i]).attr("href");
      result.push(`https://github.com${issues}`);
    }
    jsonData[topic][repoName] = result;
  };

  request(repoURL, getIssues);
};

request(url, getData);

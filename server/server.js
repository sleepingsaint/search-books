const express = require("express");
const { Client } = require("@elastic/elasticsearch");
const config = require("./config.json");
require('array.prototype.flatmap').shim()
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const client = new Client({ node: config.HOST });

// routes
// 0. Create Index -- done
// 1. Load Bulk Data -- done
// 2. Clear Data -- done
// 3. Load Individual Data -- done
// 4. Search -- done
// 5. Delete Index -- done

app.get('/', (req, resp) => {
    resp.status = 200;
    resp.send();
});

app.get('/create', async (req, resp) => {
    await client.indices.create({
        index: config.INDEX,
        body: {
            "settings": {
                "analysis": {
                    "tokenizer": {
                        "autocomplete": {
                            "type": "edge_ngram",
                            "min_gram": 1,
                            "max_gram": 20,
                            "token_chars": ["letter", "digit"]
                        }
                    },
                    "analyzer": {
                        "autocomplete": {
                            "tokenizer": "autocomplete",
                            "filter": ["lowercase"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "title": {
                        "type": "text",
                        "analyzer": "autocomplete",
                        "search_analyzer": "standard"
                    },
                    "author": {
                        "type": "text",
                        "analyzer": "autocomplete",
                        "search_analyzer": "standard"
                    },
                    "genre": {
                        "type": "text",
                        "analyzer": "autocomplete",
                        "search_analyzer": "standard"
                    },
                }
            }
        }
    }).then(() => {
        resp.status = 200;
        resp.send("Index Created Successfully :)");
    }).catch(err => {
        resp.status = 400;
        resp.send("Index creation failed");
    })
});

app.get('/delete', async (req, resp) => {
    await client.indices.delete({
        index: config.INDEX
    }).then(() => {
        resp.status = 200;
        resp.send("Deleted Successfully.")
    }).catch(err => {
        resp.status = 400;
        resp.send("Index deletion failed")
    })
});

app.get('/load-data', async (req, resp) => {
    const { books } = require("./books.json");
    const body = books.flatMap(({ Title, Author, Genre }) => [{ index: { _index: config.INDEX } }, { title: Title, author: Author, genre: Genre }])

    await client.bulk({ refresh: true, body })
        .then(async ({body: bulkResponse}) => {

            // lists all the documents which resulted in error
            if(bulkResponse.errors) {
                const erroredDocuments = []
                // The items array has the same order of the dataset we just indexed.
                // The presence of the `error` key indicates that the operation
                // that we did for the document has failed.
                bulkResponse.items.forEach((action, i) => {
                    const operation = Object.keys(action)[0]
                    if (action[operation].error) {
                        erroredDocuments.push({
                            // If the status is 429 it means that you can retry the document,
                            // otherwise it's very likely a mapping error, and you should
                            // fix the document before to try it again.
                            status: action[operation].status,
                            error: action[operation].error,
                            operation: body[i * 2],
                            document: body[i * 2 + 1]
                        })
                    }
                })
                console.log(erroredDocuments)
            }
            
            await client.count({ index: config.INDEX })
                .then(({body}) => {
                    resp.status = 200;
                    resp.send(`${body.count} documents indexed.`);
                }).catch(err => {
                    console.log(err)
                    resp.status = 400;
                    resp.send("Something went wrong");
                })
            
        }).catch(err => {
            resp.status = 400;
            resp.send("loading data failed");
        })
})

app.get('/clear-data', async (req, resp) => {
    await client.deleteByQuery({
        index: config.INDEX,
        body: {
            query: {
                match_all: {}
            }
        }
    }).then(() => {
        resp.status = 200;
        resp.send("Documents cleared successfully");
    }).catch(err => {
        resp.status = 400;
        resp.send("Clearing documents failed");
    })
});

app.get('/insert', async (req, resp) => {
    await client.index({
        index: config.INDEX,
        body: {
            title: req.body.title,
            author: req.body.author,
            genre: req.body.genre
        }
    }).then(data => {
        resp.status = 200;
        resp.send("Document indexed successfully");
    }).catch(err => {
        resp.status = 400;
        resp.send("Indexing failed");
    })
});

app.post("/search", async (req, resp) => {
    const q = req.body.q;
    await client.search({
        index: config.INDEX,
        body: {
            query: {
                bool: {
                    should: [
                        {match: {author: q}},
                        {match: {title: q}},
                        {match: {genre: q}}
                    ]
                }
            }
        }

        // adding fuzzy query to bool is runining search
        // by returning unwanted results 
        // for example query - jo with fuzziness 1 returns john, jame, and mory (unwanted)
    }).then(data => {
        resp.status = 200;
        resp.send(data.body.hits.hits);
    }).catch(err => {
        console.log(err)
        resp.status = 400;
        resp.send("Search Failed");
    })
});

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));
# AutoComplete Search using ElasticSearch

Implementing autocomplete search feature using elasticsearch. The data being used in this articles is __The top 100 bestselling books of all time__.

## Contents

* [Getting Started](#getting-started)
* [Tech Stack](#tech-stack)
* [Implementing Backend](#implementing-backend)
* [Implementing Frontend](#implementing-frontend)
* [ElasticSearch and Custom Mapping Explained](#elasticsearch-and-custom-mapping-explained)
* [References](#references)
* [Improvements](#improvements)

## Getting started

* Install all the required dependencies
    ```
    yarn add
    ```
* Create the docker container for elasticsearch. Open a terminal window and run the following command.

    ```bash
    cd server && sudo docker-compose up -d
    ```
* Starting the server. Run the following command:
    ```
    yarn server
    ```
* Send get request to the following endpoints

    | Action | Routes | Method |
    | ------ | ------ | ------- |
    | create index | http://localhost:9200/create | GET
    | load data | http://localhost:9200/load-data | GET

    <br />
    Or you can open your browser and enter these urls in your url bar and press enter.

* Now open another terminal and run the react frontend.
    ```bash
    yarn start
    ```
* Enjoy the search :)

## Tech Stack

* ElasticSearch (Main Service)
* Express Server (Backend)
* React + Typescript (Frontend)

## Implementing backend

> The config.json inside server folder holds PORT on which server should run, elasticsearch host, and index name.

* Created a basic express server to interact with elasticsearch service and to provide api endpoints for the frontend.

* Instead of downloading and installing the service I have used elasticsearch official docker image. I have added a docker-compose file in __/server__ folder. You can use this file to install elasticsearch.

    ```bash
    cd search && sudo docker-compose up -d 
    ```

    This creates elasticsearch and kibana docker containers and can be accessed on http ports 9200, 5601 respectively. 

    Kibana is just optional. It provides dev tools console which makes it easy to play around with elasticsearch and test things easliy instead of using http clients like postman etc.

* Now I have added routes to express server using which we can perform different actions.

    | Action | Routes | Method |
    | ------ | ------ | ------- |
    | create index | http://localhost:9200/create | GET
    | delete index | http://localhost:9200/delete | GET
    | load data | http://localhost:9200/load-data | GET
    | clear data | http://localhost:9200/clear-data | GET
    | insert document | http://localhost:9200/insert | POST
    | search | http://localhost:9200/search | POST |

    <br />

    > Here it is assumed that your elasticsearch service is accessible through http://localhost:9200. If your service is hosted somewhere you can change that in __config.json__ in server folder.

    <br />
    For insert action, document the document have to send through post request body as 

    ```
    {
        title: <title>,
        author: <author>,
        genre: <genre>
    }
    ```

    For search action, the query has to send through post request body

    ```
    {
        q: <query_string>
    }
    ```

* Now the backend completed.

## Implementing Frontend

* This step is pretty easy to implement. I created a function which reacts to on change event of the search bar and gets the results from the backend using search endpoint.
* Sprinkled a little bit of css to make it a little bit eye pleasing.
* Search Component is in __src/components__ folder.

## ElasticSearch and Custom Mapping Explained

* Elasticsearch is a search engine written in Java and based on Lucene Library. The basic flow will be like this
    * Some documents are stored in the ES.
    * While search or query from the client side the query we send is checked against the documents in the ES.
    * The documents which are matched are returned.

* First we need to group all the related documents in a single place inside elasticsearch, this is known as index. So we create an index first.

* Before creating an index we need to know how these documents and the fields are stored in ES or indexed (in terminology of ES). For that we define mappings / syntax which define how these documents and fields in the documents are stored in ES.

    ```
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
    ```

    This is mapping I have used for this project.

* First we have to decide what the fields of each object represent like number, string etc so that ES can process these fields and index them. One field is __keyword__ which doesn't split the text but process it as it is. Here I am using __text__ field which splits the text into different words and process them. 

* A __tokenizer__ splits the text we provided and gives it to the filter so that it can process and indexes them. First I have defined a custom tokenizer which is __edge_ngram tokenizer__. All it does is split the text we provide into different pieces and creates n_grams for each word are stores them.

* N-grams are like a sliding window that moves across the word - a continuous sequence of characters of the specified length. 

* Edge_NGRAM tokenizer produces the ngrams which are prefixes of the token. Please check the example below to get a better idea

    ```
    # text: Quick Fox

    # ngram tokenizer
    [ Q, Qu, u, ui, i, ic, c, ck, k, "k ", " ", " F", F, Fo, o, ox, x ]

    # edge_ngram tokenizer
    [ Q, Qu, Qui, Quic, Quick, F, Fo, Fox ]
    ```

* After defining a tokenizer I defined a custom analyzer which oversees the processing of the document we provides ie. tokenizing and filtering and indexing them. 

* Here I defined __search_analyzer__ as standard, because by default ES uses the analyzer we used while indexing but we don't want that behaviour while searching because it will search for every ngram obtained after analyzing the query, in the index. Sometimes we might match ngrams which are not related together. So we just search with the given words in the query.

* This is all good now we need a way to say ES we want to perform these actions. ES provides a REST API which we can use to do these operations or we can use client libraries which takes care of all the networking stuff so that we can concentrate on the actions.
    
* For searching I used a __bool__ query which matches documents matching boolean combinations of other queries. 

    ```
    query: {
        bool: {
            should: [
                {match: {author: q}},
                {match: {title: q}},
                {match: {genre: q}}
            ]
        }
    }
    ```

    Here __should__ behaves like __or__ which means it returns the document if even of the queries inside should turns out to be true.

## References

[ElasticSearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html)

[AutoComplete with ElasticSearch - part 1](https://blog.mimacom.com/autocomplete-elasticsearch-part1/)

[AutoComplete with ElasticSearch - part 2](https://blog.mimacom.com/autocomplete-elasticsearch-part1/)

[AutoComplete with ElasticSearch - part 3](https://blog.mimacom.com/autocomplete-elasticsearch-part1/)

[AutoComplete with ElasticSearch - part 4](https://blog.mimacom.com/autocomplete-elasticsearch-part4/)

[Ben Awad Implementation of ElasticSearch](https://www.youtube.com/watch?v=mPuyU4kdlVE&t=307s) - helped me understand what elasticsearch basically is and how to get started with it.

## Improvements

* Implement ngram tokenizer and fuzzy query to handle typos while searching.
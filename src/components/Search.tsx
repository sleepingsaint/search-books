import React from "react";
import styles from "./styles.module.scss";
import axios from "axios";

interface Book {
  title: string;
  author: string;
  genre: string;
}

interface SearchResult {
  _id: string;
  _index: string;
  _score: number;
  _source: Book;
  _type: string;
}

function Search() {
  const [books, setBooks] = React.useState<Array<Book>>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    let query: string = e.target.value;
    if (query) {
      axios({
        method: "post",
        url: "http://localhost:3001/search",
        data: {
          q: query,
        },
      })
        .then((resp) => {
          let data: Array<Book> = [];
          resp.data.forEach((d: SearchResult) => {
            data.push(d._source);
          });
          setBooks(data);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setBooks([]);
    }
  };

  return (
    <div className="Search">
      <div className={styles.container}>
        <h2>The top 100 bestselling books of all time</h2>
          <input
            type="text"
            onChange={handleSearch}
            placeholder="Search here"
          />
        <div className={books.length ? styles.results : ""}>
          {books.map((b: Book, index: number) => (
            <div key={index} className={styles.book}>
              <h5 className={styles.book_title}>{b.title}</h5>
              <p className={styles.book_author}>Author: {b.author}</p>
              <span className={styles.book_genre}>Genre: {b.genre}</span>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.credits}>Made using elasticsearch and react, by <a href="https://github.com/sleepingsaint">sleepingsaint</a></p>
    </div>
  );
}

export default Search;

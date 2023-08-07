import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useLocalStorageState } from "./localstorage.js"

const key = "eb397257";
const average = (arr) =>
arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useLocalStorageState([], "watched");
  const [isloading, setisloading] = useState(false);
  const [error,seterror]=useState('')
  const [query, setQuery] = useState("");
  const [selectedID, setselectedID] = useState(null);
  function handleselectedid(id) {
    setselectedID(selectedID===id?null:id);
  }
  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
    
  }
  useEffect(function () {
    localStorage.setItem("watchedd", JSON.stringify(watched));
  }, [watched]);
  function oncloseid() {
    setselectedID(null);
  }
  function watcheddeletemovies(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }
  
  useEffect(
    function () {
  

      const controller = new AbortController();

      async function fetchMovies() {
        try {
          setisloading(true);
          seterror("");

          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${key}&s=${query}`,
            { signal: controller.signal }
          );

          if (!res.ok)
            throw new Error("Something went wrong with fetching movies");

          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not found");

          setMovies(data.Search);
          seterror("");
        } catch (err) {
          if (err.name !== "AbortError") {
            console.log(err);

            seterror(err.message);
          }
        } finally {
          setisloading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        seterror("");
        return;
      }

      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (<>

    <Navbar>
      <Logo />
      <Search setQuery={setQuery}  query={query}/>
      <Numresults movies={ movies} />
    </Navbar>
    <Main>
      <Box>
        {isloading && <Loading />}
        {!isloading && !error && <MoviesList movies={movies} handleselectedid={handleselectedid}
           />}
        {error && <Error message={error } />}
        {/* isloading ? <Loading /> : <MoviesList movies={movies} /> */ }
      </Box>
      <Box>
        {selectedID ? <Moviedetails selectedID={selectedID} oncloseid={oncloseid}
          onAddWatched={handleAddWatched} watched={ watched} /> :
          <>
        <Watchedsummary watched={watched} />
        <WatchedMovieList watched={watched} ondeletemovie={watcheddeletemovies} /></>
        }</Box>
    </Main>
  </>);
}
function Moviedetails({ selectedID, oncloseid ,onAddWatched,watched}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");
  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedID);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedID
  )?.userRating;
  const countref = useRef(0);
  useEffect(function () {
    if(userRating) countref.current++;
  },[userRating])
  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;
  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedID,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countref.current,
    };

    onAddWatched(newWatchedMovie);
    oncloseid();

    // setAvgRating(Number(imdbRating));
    // setAvgRating((avgRating) => (avgRating + userRating) / 2);
  
  }
  useEffect(
    function () {
      function callback(e) {
        if (e.code === "Escape") {
          oncloseid();
        }
      }

      document.addEventListener("keydown", callback);

      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [oncloseid]
  );
  useEffect (function () {
    if (!title) return;
    document.title = `movie | ${title}`;
    return () =>
      document.title = "usePopcorn";
  },[title])
  const KEY = "eb397257";
  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedID}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedID]
  );
  return <div className="details">
  {isLoading ? (
    <Loading />
  ) : (
    <>
      <header>
        <button className="btn-back" onClick={oncloseid}>
          &larr;
        </button>
        <img src={poster} alt={`Poster of ${movie} movie`} />
        <div className="details-overview">
          <h2>{title}</h2>
          <p>
            {released} &bull; {runtime}
          </p>
          <p>{genre}</p>
          <p>
            <span>⭐️</span>
            {imdbRating} IMDb rating
          </p>
        </div>
      </header>

      {/* <p>{avgRating}</p> */}

      <section>
        <div className="rating">
          {!isWatched ? (
            <>
              <StarRating
                maxRating={10}
                size={24}
                onSetRating={setUserRating}
              />
              {userRating > 0 && (
                    <button className="btn-add"
                       onClick={handleAdd}
                    >
                  + Add to list
                </button>
              )}
            </>
          ) : (
            <p>
                    You have already rated this movie {watchedUserRating}
                    <span>⭐️</span>
            </p>
          )} 
        </div>
        <p>
          <em>{plot}</em>
        </p>
        <p>Starring {actors}</p>
        <p>Directed by {director}</p>
      </section>
    </>
  )}
</div>
}
function Loading() {
  return <p className="loader">loading...</p>;
}
function Error({message}) {
  return <p className="error"> <span>🤖</span>
    {message === "p" ? "movie not found" : "SOMETHING WENT WRONG WHILE FETCHING MOVIES"}
  </p>
  
}
  function Main({children}) {
    return (
      <>
        <main className="main">
          {children}
        </main>
      </>
    );
  }
  function Navbar({children}) {
    return (
      <nav className="nav-bar">
        {children}
      </nav>);
  }
function Search({ setQuery, query }) {
  const inputel = useRef(null);

  useEffect(
    function () {
      function callback(e) {
        if (document.activeElement === inputel.current) return;

        if (e.code === "Enter") {
          inputel.current.focus();
          setQuery("");
        }
      }

      document.addEventListener("keydown", callback);
      return () => document.addEventListener("keydown", callback);
    },
    [setQuery]
  );
    return <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputel}
    />
  }
  function Logo() {
    return <div className="logo">
      <span role="img">🍿</span>
      <h1>MovieRank</h1>
      <span role="img">📽️</span>
    </div>
  }
  function Numresults({movies}) {
    return <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  }
  function Box({children}) {
    const [isOpen1, setIsOpen1] = useState(true);
    return <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen1((open) => !open)}
        >
        {isOpen1 ? "–" : "+"}
      </button>
      {isOpen1 && 
        children
        
        }
    </div>

}
function MoviesList({movies,handleselectedid,}) {
  
  return <ul className="list">
    {movies?.map((movie) => (<Movies movie={ movie} key={movie.imdbID} handleselectedid={handleselectedid} />
      
      ))}
  </ul>
}
function Movies({movie,handleselectedid}) {
    return <li onClick={()=>{handleselectedid(movie.imdbID)}}>
    <img src={movie.Poster} alt={`${movie.Title} poster`} />
    <h3>{movie.Title}</h3>
    <div>
      <p>
        <span>📅</span>
        <span>{movie.Year}</span>
      </p>
    </div>
  </li>
  }
  // function Watchedlist() {
  
  //   const [isOpen2, setIsOpen2] = useState(true);
  
    
  //   return (
  //     <div className="box">
  //       <button
  //         className="btn-toggle"
  //         onClick={() => setIsOpen2((open) => !open)}
  //       >
  //         {isOpen2 ? "–" : "+"}
  //       </button>
  //       {isOpen2 && (
  //         <>
  //           
            

            
  //         </>
  //       )}
  //     </div>
      
    
  //   );  }
function Watchedsummary({watched}) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
    const avgUserRating = average(watched.map((movie) => movie.userRating));
    const avgRuntime = average(watched.map((movie) => movie.runtime));

  return <div className="summary">
  <h2>Movies you watched</h2>
  <div>
    <p>
      <span>#️⃣</span>
      <span>{watched.length} movies</span>
    </p>
    <p>
      <span>⭐️</span>
      <span>{avgImdbRating.toFixed(2)}</span>
    </p>
    <p>
      <span>🌟</span>
      <span>{avgUserRating.toFixed(2)}</span>
    </p>
    <p>
      <span>⏳</span>
      <span>{avgRuntime} min</span>
    </p>
  </div>
</div>
}
function WatchedMovieList({watched,ondeletemovie}) {
  return <ul className="list">
    {watched.map((movie) => (<Watchedmovie movie={movie} key={movie.imdbID}
      ondeletemovie={ondeletemovie} />
    
  ))}
</ul>
}
function Watchedmovie({ movie ,ondeletemovie}) {
  return <li >
  <img src={movie.poster} alt={`${movie.title} poster`} />
  <h3>{movie.title}</h3>
  <div>
    <p>
      <span>⭐️</span>
      <span>{movie.imdbRating}</span>
    </p>
    <p>
      <span>🌟</span>
      <span>{movie.userRating}</span>
    </p>
    <p>
      <span>⏳</span>
      <span>{movie.runtime} min</span>
      </p>
      <button className="btn-delete" onClick={()=>ondeletemovie(movie.imdbID)}>X</button>
  </div>
</li>
}
import React, { useEffect } from 'react'

const Home = () => {
    useEffect(() => {
        document.title = "Home - ChennaiGames";
    }, []);
    return (
        <>
           <center>
           <br/><br/>       
           {/* <img src='../assets/images/logo-d.png' alt='' width={500} /> */}
           <br/><br/><br/>
           <h1>Welcome!</h1>
           
           

           </center>

        </>
    )
}

export default Home
import { useEffect } from "react"
import api from "../api"


const Home = () => 
 {
    // Fetch and log authenticated shop details testing protected route remove it later
    useEffect(() => {
        api.get("/auth/me").then(res => console.log(res.data)).catch(console.error)
    }, [])

  return (
    <h1 className="text-2xl font-bold">Dashboard</h1>
  )
}

export default Home;
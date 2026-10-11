import { useState } from "react"; 
import { Link } from "react-router-dom"; 
import Layout from "../components/layout"; 

const Login = () => { 
  const [credentials, setCredentials] = useState({ 
    email: "", 
    password: "", 
  }); 

  const handleInputChange = (e) => { 
    const { name, value } = e.target; 
    setCredentials({ ...credentials, [name]: value }); 
  }; 

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    console.log(credentials); 
  }; 

  return ( 
    <Layout> 
      <h3>Login</h3> 
      <form onSubmit={handleSubmit}> 
        <div className="form-group my-2"> 
          <label className="form-label">Email address</label> 
          <input 
            type="email" 
            className="form-control" 
            name="email" 
            value={credentials.email} 
            onChange={handleInputChange} 
            placeholder="johndoe@example.com" 
            required 
          /> 
        </div> 

        <div className="form-group my-2"> 
          <label className="form-label">Password</label> 
          <input 
            type="password" 
            className="form-control" 
            name="password" 
            value={credentials.password} 
            onChange={handleInputChange} 
            placeholder="Enter password" 
            required 
          /> 
        </div> 

        <button type="submit" className="btn btn-primary my-2">
          Login
        </button>

        <p> 
          Don't have an account? <Link to="/register">Create one</Link> 
        </p> 
      </form> 
    </Layout> 
  ); 
}; 

export default Login;

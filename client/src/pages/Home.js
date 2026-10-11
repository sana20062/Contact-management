import Layout from "../components/layout"; 

const Home = () => { 
  return ( 
    <Layout>
      <div className="container my-5 text-center">
        <h1>Welcome to Our Application</h1>
        <p className="lead">This is the home page. Please login or register to get started.</p>
      </div>
    </Layout>
  ); 
}; 

export default Home;

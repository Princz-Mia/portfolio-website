import { BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";

const App = () => (
  <>
    <BrowserRouter>
        <Navbar />
        <Home />
    </BrowserRouter>
  </>
);

export default App;

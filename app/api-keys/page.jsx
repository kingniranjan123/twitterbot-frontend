"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Navbar, Nav, Spinner, Alert, Button } from "react-bootstrap";
import { usePathname } from "next/navigation";
import { House, ChatText, Prohibit, List, Monitor, Key, TwitterLogo, SignOut, ChartLine} from "phosphor-react";
import "./style.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState({ openrouter: "", rapidapi: "", twitterapi: "" });
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(false);
    const pathname = usePathname();
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/api-keys`)
            .then((res) => res.json())
            .then((data) => setApiKeys(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    const handleInputChange = (e) => {
        setApiKeys({ ...apiKeys, [e.target.name]: e.target.value });
    };
    
    const handleLogout = () => {
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        window.location.href = "/admin"; // Redirigir al login
    };
    
    const saveApiKeys = () => {
        setIsFetching(true);
        setMessage("");
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/api-keys`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiKeys),
        })
            .then((res) => res.json())
            .then(() => setMessage("API Keys actualizadas correctamente"))
            .catch(() => setMessage("Error al actualizar API Keys"))
            .finally(() => setIsFetching(false));
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Spinner animation="border" role="status" className="loader">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className={`dashboard ${isSidebarOpen ? "sidebar-open" : ""}`}>
            <div className={`sidebar ${isSidebarOpen ? "active" : ""}`}>
            <Nav defaultActiveKey="/" className="flex-column">
            <hr className="hr-line"/>
              <Nav.Link
                href="/"
                className={`textl hometext ${pathname === "/" ? "active-link" : ""}`}
              >
                <House size={20} weight="bold" className="me-2" /> Home
              </Nav.Link>
              {/* <Nav.Link
                href="/api-status"
                className={`textl ${pathname === "/api-status" ? "active-link" : ""}`}
              >
                <Monitor  size={20} weight="bold" className="me-2" /> API Status
              </Nav.Link> */}
              <Nav.Link
                href="/api-keys"
                className={`textl ${pathname === "/api-keys" ? "active-link" : ""}`}
              >
                <Key  size={20} weight="bold" className="me-2" /> API Keys
              </Nav.Link>
	              <Nav.Link
	                href="/usages"
	                className={`textl ${pathname === "/usages" ? "active-link" : ""}`}
	              >
	                <ChartLine  size={20} weight="bold" className="me-2" /> Usages
   	           </Nav.Link>
              <Nav.Link
                href="/logs"
                className={`textl ${pathname === "/logs" ? "active-link" : ""}`}
              >
                <ChatText size={20} weight="bold" className="me-2" /> Logs
              </Nav.Link>
              {/* <Nav.Link
                href="/rate-limits"
                className={`textl ${pathname === "/rate-limits" ? "active-link" : ""}`}
              >
                <Prohibit size={20} weight="bold" className="me-2" /> Rate Limits
              </Nav.Link> */}
              {/* <Nav.Link
                href="/tweets"
                className={`textl ${pathname === "/tweets" ? "active-link" : ""}`}
              >
                <TwitterLogo  size={20} weight="bold" className="me-2" /> Tweets
              </Nav.Link> */}
              <Nav.Link
                href="#"
                onClick={handleLogout}
                className="textl logout-link"
              >
                <SignOut size={20} weight="bold" className="me-2" /> Logout
              </Nav.Link>
            </Nav>
            </div>

            <div className="main-content">
                <Navbar className="navbar px-3">
                    <button className="btn btn-outline-primary d-lg-none" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        <List className="bi bi-list" />
                    </button>
                </Navbar>

                <Container fluid className="py-4">
                    <Row>
                        <Col md={5}><h5 className="dashboard-title">Dashboard <span className="mensajes-title">&gt; API Keys</span></h5></Col>
                    </Row>
                    <Row>
                        {Object.entries(apiKeys).map(([keyName, keyValue]) => (
                            <Col md={6} key={keyName}>
                                <div className="mb-3">
                                    <label className="label-in form-label">{keyName.toUpperCase()} API Key</label>
                                    <input type="text" className="in form-control" placeholder='Enter your API Key' name={keyName} value={keyValue || ''} onChange={handleInputChange} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                    <div className="d-flex justify-content-center">
                        <Button className="btn-save btn-style-1" onClick={saveApiKeys} disabled={isFetching}>
                            {isFetching ? "Saving..." : "Save"}
                        </Button>
                    </div>
                    {message && (
                        <Row>
                            <Col>
                                <Alert className='alertme' variant={message.includes("Error") ? "danger" : "success"}>{message}</Alert>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>
        </div>
    );
}

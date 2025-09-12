"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Container, Row, Col, Navbar, Nav, Spinner} from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";
import { House, ChatText, List, Key, SignOut, ChartLine} from "phosphor-react";
import "./style.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);
  const [usageStats, setUsageStats] = useState({
    openrouter: [],
    rapidapi: [],
    "twitterapi.io": []
  });

  const pathname = usePathname();

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

useEffect(() => {
  const fetchUsageData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usage/requests-per-day`);
      const data = await res.json();
      console.log("📊 Data usage:", data);

      const getChartData = (apiKey) => {
        const days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          const key = date.toISOString().split("T")[0];
          return {
            day: `${date.getMonth() + 1}-${date.getDate()}`,
            usage: data[key]?.[apiKey.toUpperCase()] || 0
          };
        });
        return days;
      };

      setUsageStats({
        openrouter: getChartData("openrouter"),
        rapidapi: getChartData("rapidapi"),
        "twitterapi.io": getChartData("twitterapi.io")
      });
    } catch (err) {
      console.error("Error fetching usage stats:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchUsageData();
}, []);

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/admin";
  };

  const renderChart = (title, data) => {
    let chartWidth = "50%";
    if (windowWidth <= 600) {
      chartWidth = "100%";
    } else if (windowWidth <= 1335) {
      chartWidth = "70%";
    }

    return (
      <div className="mb-4">
        <div className="chart-usage2 d-flex justify-content-center">
          <h6 className="mb-2">{title}</h6>
        </div>
        <div className="chart-usage d-flex justify-content-center">
          <ResponsiveContainer width={chartWidth} height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" angle={-45} textAnchor="end" height={40} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="usage" fill="#007bff" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
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
          <hr className="hr-line" />
          <Nav.Link href="/" className={`textl hometext ${pathname === "/" ? "active-link" : ""}`}>
            <House size={20} weight="bold" className="me-2" /> Home
          </Nav.Link>
          <Nav.Link href="/api-keys" className={`textl ${pathname === "/api-keys" ? "active-link" : ""}`}>
            <Key size={20} weight="bold" className="me-2" /> API Keys
          </Nav.Link>
          <Nav.Link href="/usages" className={`textl ${pathname === "/usages" ? "active-link" : ""}`}>
            <ChartLine size={20} weight="bold" className="me-2" /> Usages
          </Nav.Link>
          <Nav.Link href="/logs" className={`textl ${pathname === "/logs" ? "active-link" : ""}`}>
            <ChatText size={20} weight="bold" className="me-2" /> Logs
          </Nav.Link>
          <Nav.Link href="#" onClick={handleLogout} className="textl logout-link">
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
            <Col md={6}>
              <h5 className="dashboard-title">Dashboard <span className="mensajes-title">&gt; API Usages</span></h5>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              {renderChart("OpenRouter Requests (Last 7 Days)", usageStats.openrouter)}
              {renderChart("RapidAPI Requests (Last 7 Days)", usageStats.rapidapi)}
              {renderChart("TwitterAPI Requests (Last 7 Days)", usageStats["twitterapi.io"])}
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

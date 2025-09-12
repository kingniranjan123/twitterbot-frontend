"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAccounts } from "../lib/api";
import { Container, Row, Modal, Nav, Navbar, Spinner, Button } from "react-bootstrap";
import {
  House,
  ChatText,
  PlusCircle,
  Gear,
  Trash,
  ChartLine,
  Key,
  List,
  SignOut,
  PlayCircle,
  PauseCircle,
} from "phosphor-react";
import "./style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
// import Sidebar from "@/components/Sidebar"; // si no se usa, dejar comentado

dayjs.extend(utc);

export default function Home() {
  const [accounts, setAccounts] = useState([]);
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [individualProcesses, setIndividualProcesses] = useState({});
  const [disabledProcessButtons, setDisabledProcessButtons] = useState(false);
  const [provider, setProvider] = useState("RAPIDAPI");
  const [changingProvider, setChangingProvider] = useState(false);

  const fetchProvider = async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tweets/provider-source`);
      const j = await r.json();
      if (j && (j.value === "RAPIDAPI" || j.value === "TWITTERAPI.IO")) {
        setProvider(j.value);
      }
    } catch (e) {
      console.error("❌ Error getting provider:", e);
    }
  };

  const toggleProvider = async () => {
    if (changingProvider) return;
    setChangingProvider(true);
    try {
      const next = provider === "RAPIDAPI" ? "TWITTERAPI.IO" : "RAPIDAPI";
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tweets/provider-source`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: next }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error || "Error changing provider");
      }
      const j = await r.json();
      if (j && (j.value === "RAPIDAPI" || j.value === "TWITTERAPI.IO")) {
        setProvider(j.value);
      }
    } catch (e) {
      console.error("❌ Error changing provider:", e);
    } finally {
      setChangingProvider(false);
    }
  };

  const toggleProcess = (index) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  const handleOpenAddAccount = () => setShowAddAccountModal(true);
  const handleCloseAddAccount = () => setShowAddAccountModal(false);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "-";
    const now = dayjs();
    const date = dayjs.utc(timestamp).local();
    if (!date.isValid()) return "-";

    const diffMinutes = now.diff(date, "minute");
    if (diffMinutes < 1) return "1m";
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = now.diff(date, "hour");
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = now.diff(date, "day");
    return `${diffDays}d`;
  };

  useEffect(() => {
    const fetchAccountsSafe = async () => {
      try {
        const data = await getAccounts();
        const list = Array.isArray(data) ? data : [];
        setAccounts(list);

        const statuses = {};
        for (const acc of list) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status-process/${acc.id}`);
            const status = await res.json();
            statuses[acc.id] = status && status.status === "running";
          } catch {
            statuses[acc.id] = false;
          }
        }
        setIndividualProcesses(statuses);
      } catch (error) {
        console.error("❌ Error al obtener cuentas o estados:", error);
        setAccounts([]);
        setIndividualProcesses({});
      }
    };

    const checkFetchingStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status-fetch`);
        const data = await response.json();
        const running = data && data.status === "running";
        setIsFetching(running);
        setDisabledProcessButtons(running);
      } catch (error) {
        console.error("❌ Error al verificar el estado de recolección:", error);
      }
    };

    const init = async () => {
      await checkFetchingStatus();
      await fetchAccountsSafe();
      await fetchProvider();
      setLoading(false);
    };

    init();
  }, []);

  const handleToggleIndividualProcess = async (userId) => {
    const isRunning = !!individualProcesses[userId];
    try {
      const endpoint = isRunning ? `/stop-process/${userId}` : `/start-process/${userId}`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { method: "POST" });
      if (!response.ok) throw new Error("Error en la solicitud");

      setIndividualProcesses((prev) => ({
        ...prev,
        [userId]: !isRunning,
      }));
    } catch (error) {
      console.error("❌ Error al cambiar estado del proceso individual:", error);
    }
  };

  const handleShowModal = (twitterId) => {
    setSelectedAccount(twitterId);
    setShowModal(true);
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/admin";
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
  };

  const startStopProcess = async () => {
    setIsFetching((prev) => !prev);
    setDisabledProcessButtons((prev) => !prev);

    try {
      const endpoint = isFetching ? "/stop-fetch" : "/start-fetch";
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { method: "POST" });
      if (!response.ok) throw new Error("Error en la solicitud al backend");

      setTimeout(async () => {
        try {
          const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status-fetch`);
          const statusData = await statusResponse.json();
          const running = statusData && statusData.status === "running";

          setIsFetching(running);
          setDisabledProcessButtons(running);

          if (!running) {
            const resetProcesses = {};
            (Array.isArray(accounts) ? accounts : []).forEach((acc) => {
              resetProcesses[acc.id] = false;
            });
            setIndividualProcesses(resetProcesses);
          }
        } catch (e) {
          console.error("❌ Error refrescando estado global:", e);
        }
      }, 3000);
    } catch (error) {
      console.error("❌ Error al iniciar o detener el proceso:", error);
      setIsFetching((prev) => !prev);
      setDisabledProcessButtons((prev) => !prev);
    }
  };

  const deleteAccount = async () => {
    if (!selectedAccount) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/${selectedAccount}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar la cuenta");
      setAccounts((prev) => (Array.isArray(prev) ? prev.filter((a) => a.twitter_id !== selectedAccount) : []));
    } catch (error) {
      console.error("❌ Error al eliminar la cuenta:", error);
    } finally {
      handleCloseModal();
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  if (loading) {
    return (
      <div className="loader-container">
        <Spinner animation="border" role="status" className="loader">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  return (
    <>
      <div className={`dashboard ${isSidebarOpen ? "sidebar-open" : ""}`}>
        {/* Sidebar */}
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

        {/* Main Content */}
        <div className="main-content">
          {/* Topbar */}
          <Navbar className="navbar px-3">
            <button className="btn btn-outline-primary d-lg-none" onClick={toggleSidebar}>
              <List size={20} className="bi bi-list" />
            </button>
          </Navbar>

          {/* Page Content */}
          <Container fluid className="py-4">
            <Row>
              <div className="col-12 col-md-5">
                <h5 className="dashboard-title">
                  Dashboard <span className="mensajes-title">&gt; Home</span>
                </h5>
              </div>

              {/* Toggle Provider */}
              <div className="col-12 col-md-3 d-flex justify-content-center align-items-center mb-3 mb-md-0">
                <div className="provider-toggle" role="button" aria-label="Cambiar proveedor" onClick={toggleProvider}>
                  <div className={`pill ${provider === "RAPIDAPI" ? "left" : "right"} ${changingProvider ? "loading" : ""}`}>
                    <span className={`opt ${provider === "RAPIDAPI" ? "active" : ""}`}>RapidAPI</span>
                    <span className={`opt ${provider === "TWITTERAPI.IO" ? "active" : ""}`}>TwitterAPI.io</span>
                  </div>
                </div>
              </div>

              {/* Start, Stop */}
              <div className="col-6 col-md-3 d-flex justify-content-center">
                <button
                  className={`text-center btn ${isFetching ? "btn-danger" : "btn-primary"} btn-account-ps3 btn-read`}
                  onClick={startStopProcess}
                >
                  {isFetching ? "Stop Process" : "Start Process"}
                </button>
              </div>

              <div className="col-6 col-md-1 d-flex justify-content-center">
                <button className="btn-account-ps2 btn-account-ps text-center btn" onClick={handleOpenAddAccount}>
                  <Gear size={26} />
                </button>
              </div>
            </Row>

            <div className="api-status-container d-flex flex-wrap mb-4">
              {[
                { name: "OpenRouter", status: true },
                { name: "Rapid API", status: true },
                { name: "Posting", status: isFetching },
              ].map((api, index) => (
                <div key={index} className="api-box d-flex align-items-center justify-content-center">
                  {api.name}
                  {api.status ? (
                    <svg
                      className="svg-tick"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g>
                        <path
                          d="M18.3334 9.2333V9.99997C18.3323 11.797 17.7504 13.5455 16.6745 14.9848C15.5985 16.4241 14.0861 17.477 12.3628 17.9866C10.6395 18.4961 8.79774 18.4349 7.11208 17.8121C5.42642 17.1894 3.98723 16.0384 3.00915 14.5309C2.03108 13.0233 1.56651 11.24 1.68475 9.4469C1.80299 7.65377 2.49769 5.94691 3.66525 4.58086C4.83281 3.21482 6.41068 2.26279 8.16351 1.86676C9.91635 1.47073 11.7502 1.65192 13.3917 2.3833"
                          stroke="#00D13F"
                        />
                        <path d="M18.3333 3.33325L10 11.6749L7.5 9.17492" stroke="#00D13F" />
                      </g>
                      <defs>
                        <clipPath id="clip0_150_582">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FF3B30"
                      className="ms-2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th className="hide-on-mobile">Rate Limit</th>
                    <th className="hide-on-mobile">Followers</th>
                    <th>Extracted</th>
                    <th className="hide-on-mobile">Last Extract</th>
                    <th className="hide-on-mobile">Last Post</th>
                    <th>Process</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(safeAccounts) ? safeAccounts : []).map((acc, index) => (
                    <tr key={index}>
                      <td className="" onClick={() => (window.location.href = `/account/${acc.twitter_id}`)}>
                        <img
                          src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"}
                          alt="avatar"
                          className="avatar"
                        />
                        <span className="username-td">@{acc.username}</span>
                      </td>
                      <td className="hide-on-mobile" onClick={() => (window.location.href = `/account/${acc.twitter_id}`)}>
                        {acc.rate_limit}
                      </td>
                      <td className="hide-on-mobile" onClick={() => (window.location.href = `/account/${acc.twitter_id}`)}>
                        {acc.followers}
                      </td>
                      <td>
                        <span className="bubble" onClick={() => (window.location.href = `/tweets/${acc.id}`)}>
                          {acc.collected_tweets}
                        </span>
                      </td>
                      <td className="hide-on-mobile" onClick={() => (window.location.href = `/account/${acc.twitter_id}`)}>
                        {formatTimeAgo(acc.last_extract)}
                      </td>
                      <td className="hide-on-mobile" onClick={() => (window.location.href = `/account/${acc.twitter_id}`)}>
                        {formatTimeAgo(acc.last_post)}
                      </td>
                      <td>
                        <button
                          className="process-btn"
                          onClick={() => handleToggleIndividualProcess(acc.id)}
                          disabled={disabledProcessButtons}
                        >
                          {isFetching || individualProcesses[acc.id] ? (
                            <PauseCircle size={24} className="pause" />
                          ) : (
                            <PlayCircle size={24} className="play" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </div>
      </div>

      <Modal show={showModal} className="modal-delete" onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this account?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteAccount}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAddAccountModal} onHide={handleCloseAddAccount} centered className="modal-add-account">
        <Modal.Header closeButton>
          <Modal.Title className="title-modal">Add account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="add-account-box text-center mb-4" onClick={() => router.push("/auth/login")}>
            <span className="add-account-text">Add new account</span>
            <PlusCircle className="plusbtn" size={24} />
          </div>

          {(Array.isArray(safeAccounts) ? safeAccounts : []).map((acc, i) => (
            <div key={i} className="account-entry d-flex align-items-center justify-content-between px-3 py-2 mb-2">
              <div className="d-flex align-items-center">
                <img
                  src={acc.profile_pic || "https://avatar.iran.liara.run/public/boy"}
                  className="avatar me-2"
                  alt="avatar"
                />
                <span>@{acc.username}</span>
              </div>
              <span
                className="trash-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowModal(acc.twitter_id);
                }}
              >
                <Trash size={24} />
              </span>
            </div>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
}

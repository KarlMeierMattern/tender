"use client";

import React, { useState, useEffect } from "react";

export default function TendersPage() {
  const [tenders, setTenders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await fetch("/api/tenders");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (data.success) {
          setTenders(data.data);
        }
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Tenders</h1>
      <ol>
        {tenders.map((tender, index) => (
          <li key={index}>{tender.description}</li>
        ))}
      </ol>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate } from "react-router-dom";

const mainColor = "#da1c5c";
const lightMainColor = "#2b3990";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          navigate("/signin");
          return;
        }

        const userId = userData.user.id;
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Erro ao buscar perfil:", error);
          alert("Não foi possível carregar o perfil.");
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
        alert("Ocorreu um erro inesperado.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erro ao sair.");
    } else {
      navigate("/signin");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20vh" }}>
        <p style={{ color: "#262525" }}>Carregando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", marginTop: "20vh" }}>
        <p style={{ color: "#262525" }}>Perfil não encontrado.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "40px 0",
          backgroundColor: mainColor,
          borderBottomLeftRadius: "32px",
          borderBottomRightRadius: "32px",
        }}
      >
        <img
          src={profile.avatar_url || "https://via.placeholder.com/120"}
          alt="Avatar"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            marginBottom: 12,
            border: "4px solid #fff",
          }}
        />
        <h2 style={{ color: "#fff", marginBottom: 4 }}>{profile.name}</h2>
        <p style={{ color: "#fff", opacity: 0.8 }}>{profile.email}</p>
      </div>

      {/* Informações */}
      <div style={{ padding: "20px" }}>
        {profile.phone && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "8px",
            }}
          >
            📞 <span style={{ marginLeft: 8 }}>{profile.phone}</span>
          </div>
        )}
        {profile.location && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            📍 <span style={{ marginLeft: 8 }}>{profile.location}</span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div style={{ padding: "0 20px 20px" }}>
        <button onClick={() => navigate(`/profile/${profile.id}/notifications`)} className="profile-btn">
          🔔 Notificação
        </button>
        <button onClick={() => navigate(`/profile/publicacoes`)} className="profile-btn">
          📄 Publicação
        </button>
        <button onClick={() => navigate(`/profile/${profile.id}/edit`)} className="profile-btn">
          ✏️ Editar Perfil
        </button>
        <button onClick={() => navigate(`/profile/sobre`)} className="profile-btn">
          ℹ️ Sobre
        </button>

        <button
          onClick={handleLogout}
          className="profile-btn logout"
          style={{
            color: mainColor,
            borderColor: mainColor,
            fontWeight: 600,
          }}
        >
          🚪 Sair
        </button>
      </div>
    </div>
  );
}

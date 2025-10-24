import { supabase } from "../utils/supabase";
import React, { useState } from "react";

const mainColor = "#d91c5c";
const lightMainColor = "#f2c1c9";

export default function SharePersonButton({ person, onShared }) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);

      const shareData = {
        title: "Pessoa Desaparecida",
        text: `🚨 Pessoa Desaparecida 🚨
Nome: ${person.nome}
Idade: ${person.idade} anos
Última localização: ${person.ultima_localizacao}
Contacto: ${person.contacto_do_responsavel || "N/A"}
Descrição: ${person.descricao_detalhada}`,
      };

      // Web Share API (se suportado)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // fallback: copiar para clipboard
        await navigator.clipboard.writeText(shareData.text);
        alert("Texto copiado para o clipboard!");
      }

      // Registrar share no Supabase
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from("missing_people_shares").insert({
          missing_person_id: person.id,
          user_id: userData.user.id,
        });
        if (onShared) onShared();
      }
    } catch (err) {
      console.log("Erro ao compartilhar:", err);
      alert("Erro ao compartilhar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      style={{
        padding: 6,
        borderRadius: 6,
        backgroundColor: lightMainColor,
        border: `1px solid ${mainColor}`,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Carregando..." : "🔗 Compartilhar"}
    </button>
  );
}

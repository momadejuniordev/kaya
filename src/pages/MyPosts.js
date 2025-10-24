import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import CommentsSection from "../components/CommentsSection";
import SharePersonButton from "../components/ShareButton";


export default function MyPosts() {
  const [userId, setUserId] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [encerrarMotivo, setEncerrarMotivo] = useState("");
  const [encerrarStatus, setEncerrarStatus] = useState("Encontrada");

  // Obter usuário autenticado
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Buscar publicações do usuário
  const fetchMyPosts = async () => {
    if (!userId) return;
    setRefreshing(true);

    const { data: posts, error } = await supabase
      .from("missing_people")
      .select("*")
      .eq("reported_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar publicações:", error);
      setMyPosts([]);
      setRefreshing(false);
      return;
    }

    // Contagem de likes, comentários, shares
    const postsWithCounts = await Promise.all(
      (posts ?? []).map(async (post) => {
        const { count: likesCount } = await supabase
          .from("missing_people_likes")
          .select("*", { count: "exact", head: true })
          .eq("missing_person_id", post.id);

        const { data: userLiked } = await supabase
          .from("missing_people_likes")
          .select("*")
          .eq("missing_person_id", post.id)
          .eq("user_id", userId)
          .maybeSingle();

        const { count: commentsCount } = await supabase
          .from("status_comments")
          .select("*", { count: "exact", head: true })
          .eq("missing_person_id", post.id);

        const { count: sharesCount } = await supabase
          .from("missing_people_shares")
          .select("*", { count: "exact", head: true })
          .eq("missing_person_id", post.id);

        return {
          ...post,
          likes_count: likesCount ?? 0,
          comments_count: commentsCount ?? 0,
          shares_count: sharesCount ?? 0,
          liked_by_user: !!userLiked,
        };
      })
    );

    setMyPosts(postsWithCounts);
    setRefreshing(false);
  };

  useEffect(() => {
    if (userId) fetchMyPosts();
  }, [userId]);

  const handleLike = async (post) => {
    if (!userId) return;

    if (post.liked_by_user) {
      await supabase
        .from("missing_people_likes")
        .delete()
        .eq("missing_person_id", post.id)
        .eq("user_id", userId);
    } else {
      await supabase.from("missing_people_likes").insert({
        user_id: userId,
        missing_person_id: post.id,
      });
    }

    setMyPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_user: !p.liked_by_user,
              likes_count: p.liked_by_user
                ? (p.likes_count ?? 0) - 1
                : (p.likes_count ?? 0) + 1,
            }
          : p
      )
    );
  };

  const openEncerrarModal = (postId) => {
    setSelectedPostId(postId);
    setEncerrarMotivo("");
    setEncerrarStatus("Encontrada");
    setModalVisible(true);
  };

  const handleConfirmEncerrar = async () => {
    if (!selectedPostId || !encerrarMotivo) return;

    try {
      const { error } = await supabase
        .from("missing_people")
        .update({ status: encerrarStatus, encerrado_motivo: encerrarMotivo })
        .eq("id", selectedPostId);

      if (error) throw error;

      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPostId
            ? { ...p, status: encerrarStatus, encerrado_motivo: encerrarMotivo }
            : p
        )
      );

      setModalVisible(false);
      window.alert("Publicação encerrada com sucesso!");
    } catch (err) {
      console.error("Erro ao encerrar publicação:", err);
      window.alert("Não foi possível encerrar a publicação.");
    }
  };

  if (loading) return <p>Carregando publicações...</p>;

  return (
    <div style={{ padding: 16 }}>
      {myPosts.map((post) => (
        <div key={post.id} style={{ border: "1px solid #ccc", borderRadius: 12, marginBottom: 16, padding: 16 }}>
          {post.photo_url && (
            <img src={post.photo_url} alt={post.nome} style={{ width: "100%", borderRadius: 12 }} />
          )}

          {post.status && <span style={{ backgroundColor: "#d91c5c", color: "#fff", padding: "2px 6px", borderRadius: 6 }}>{post.status}</span>}

          <h3>{post.nome}</h3>
          <p>{post.category}</p>
          <p>Última localização: {post.ultima_localizacao}</p>
          <p>{post.descricao_detalhada}</p>
          <p>{new Date(post.created_at).toLocaleString()}</p>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => handleLike(post)}>
              {post.liked_by_user ? "❤️" : "🤍"} {post.likes_count ?? 0} Likes
            </button>
            <button>
              💬 {post.comments_count ?? 0} Comentários
            </button>
            <SharePersonButton person={post} onShared={() => {
              setMyPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, shares_count: (p.shares_count ?? 0) + 1 } : p));
            }} />
            <span>{post.shares_count ?? 0} Partilhas</span>
          </div>

          {post.status && (
            <div>
              <p>Status: {post.status}</p>
              <p>Motivo: {post.encerrado_motivo}</p>
            </div>
          )}

          <button onClick={() => !post.status && openEncerrarModal(post.id)} disabled={!!post.status}>
            {post.status ? "Publicação encerrada" : "Encerrar publicação"}
          </button>

          <CommentsSection missingPersonId={Number(post.id)} />
        </div>
      ))}

      {modalVisible && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "90%" }}>
            <h3>Encerrar publicação</h3>
            <label>Motivo do encerramento:</label>
            <input value={encerrarMotivo} onChange={(e) => setEncerrarMotivo(e.target.value)} placeholder="Digite o motivo" />

            <label>Status da pessoa:</label>
            <select value={encerrarStatus} onChange={(e) => setEncerrarStatus(e.target.value)}>
              <option value="Encontrada">Encontrada</option>
              <option value="Caso encerrado">Caso encerrado</option>
              <option value="Outros">Outros</option>
            </select>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={() => setModalVisible(false)}>Cancelar</button>
              <button onClick={handleConfirmEncerrar} style={{ backgroundColor: "#d91c5c", color: "#fff" }}>Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

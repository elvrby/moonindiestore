// app/components/CommentsSection.tsx
"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../src/lib/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";

interface Comment {
  id?: string;
  productSlug: string;
  username: string;
  email: string;
  comment: string;
  timestamp: any;
  parentId?: string;
}

interface CommentsSectionProps {
  productSlug: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ productSlug }) => {
  // State untuk komentar utama dan reply
  const [comments, setComments] = useState<Comment[]>([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [commentText, setCommentText] = useState("");

  // State untuk reply; menyimpan id komentar yang sedang di-reply dan field untuk reply
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyUsername, setReplyUsername] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [replyText, setReplyText] = useState("");

  // Ambil komentar dari Firestore untuk produk tertentu
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("productSlug", "==", productSlug),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Comment[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(data);
    });
    return () => unsubscribe();
  }, [productSlug]);

  // Fungsi untuk mengirim komentar utama
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !commentText) return;
    try {
      await addDoc(collection(db, "comments"), {
        productSlug,
        username,
        email,
        comment: commentText,
        timestamp: serverTimestamp()
      });
      setUsername("");
      setEmail("");
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  // Fungsi untuk mengirim reply pada komentar tertentu
  const handleReplySubmit = async (parentId: string) => {
    if (!replyUsername || !replyEmail || !replyText) return;
    try {
      await addDoc(collection(db, "comments"), {
        productSlug,
        username: replyUsername,
        email: replyEmail,
        comment: replyText,
        timestamp: serverTimestamp(),
        parentId: parentId
      });
      setReplyUsername("");
      setReplyEmail("");
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding reply: ", error);
    }
  };

  // Filter komentar utama (tanpa parentId)
  const mainComments = comments.filter((c) => !c.parentId);

  // Fungsi untuk mendapatkan reply untuk sebuah komentar
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>

      {/* Tampilkan daftar komentar jika ada */}
      {comments.length > 0 ? (
        <div>
          {mainComments.map((c) => (
            <div key={c.id} className="border p-4 mb-4">
              <div className="flex justify-between items-center">
                <div className="font-bold">{c.username}</div>
                <div className="text-sm text-gray-500">
                  {c.timestamp
                    ? new Date(c.timestamp.seconds * 1000).toLocaleString()
                    : "Just now"}
                </div>
              </div>
              <p className="mt-2">{c.comment}</p>
              {/* Tombol Reply untuk setiap komentar */}
              <button
                className="text-blue-500 mt-2"
                onClick={() => setReplyingTo(c.id || null)}
              >
                Reply
              </button>

              {/* Form Reply akan tampil jika komentar ini yang sedang di-reply */}
              {replyingTo === c.id && (
                <div className="mt-4 ml-4">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={replyUsername}
                    onChange={(e) => setReplyUsername(e.target.value)}
                    className="border p-2 mr-2 mb-2"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={replyEmail}
                    onChange={(e) => setReplyEmail(e.target.value)}
                    className="border p-2 mr-2 mb-2"
                    required
                  />
                  <textarea
                    placeholder="Your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="border p-2 w-full mb-2"
                    required
                  ></textarea>
                  <button
                    onClick={() => c.id && handleReplySubmit(c.id)}
                    className="bg-blue-500 text-white px-4 py-2"
                  >
                    Submit Reply
                  </button>
                </div>
              )}

              {/* Tampilkan reply yang sudah ada untuk komentar ini */}
              {getReplies(c.id || "").map((reply) => (
                <div key={reply.id} className="mt-4 ml-8 border-l pl-4">
                  <div className="flex justify-between items-center">
                    <div className="font-bold">{reply.username}</div>
                    <div className="text-sm text-gray-500">
                      {reply.timestamp
                        ? new Date(reply.timestamp.seconds * 1000).toLocaleString()
                        : "Just now"}
                    </div>
                  </div>
                  <p className="mt-2">{reply.comment}</p>
                  {/* Jika diinginkan, tombol reply juga bisa disediakan untuk reply di level selanjutnya */}
                  <button
                    className="text-blue-500 mt-2"
                    onClick={() => setReplyingTo(reply.id || null)}
                  >
                    Reply
                  </button>
                  {replyingTo === reply.id && (
                    <div className="mt-4 ml-4">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={replyUsername}
                        onChange={(e) => setReplyUsername(e.target.value)}
                        className="border p-2 mr-2 mb-2"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        value={replyEmail}
                        onChange={(e) => setReplyEmail(e.target.value)}
                        className="border p-2 mr-2 mb-2"
                        required
                      />
                      <textarea
                        placeholder="Your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="border p-2 w-full mb-2"
                        required
                      ></textarea>
                      <button
                        onClick={() => reply.id && handleReplySubmit(reply.id)}
                        className="bg-blue-500 text-white px-4 py-2"
                      >
                        Submit Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p>No comments yet. Be the first to comment!</p>
      )}

      {/* Form untuk mengirim komentar baru */}
      <form onSubmit={handleSubmit} className="mt-6">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 mr-2 mb-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mr-2 mb-2"
          required
        />
        <textarea
          placeholder="Write your comment here..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="border p-2 w-full mb-2"
          required
        ></textarea>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Submit Comment
        </button>
      </form>
    </div>
  );
};

export default CommentsSection;

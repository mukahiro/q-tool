import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  Timestamp,
  doc,
  getFirestore,
  writeBatch,
} from "firebase/firestore";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const envText = readFileSync(envPath, "utf8");

  for (const line of envText.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const [key, ...valueParts] = trimmedLine.split("=");
    process.env[key] ??= valueParts.join("=");
  }
}

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function timestamp(value) {
  return Timestamp.fromDate(new Date(value));
}

async function signInOrCreateTeacher(auth) {
  const email = process.env.TEST_TEACHER_EMAIL ?? "teacher@example.com";
  const password = process.env.TEST_TEACHER_PASSWORD ?? "password123";

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    console.log(`Created test teacher: ${email}`);
    return credential.user;
  } catch (error) {
    if (error?.code !== "auth/email-already-in-use") {
      throw error;
    }

    const credential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Signed in existing test teacher: ${email}`);
    return credential.user;
  }
}

function setBatchData(batch, db, path, data) {
  batch.set(doc(db, path), data);
  console.log(`Queued: ${path}`);
}

async function main() {
  loadEnvLocal();

  const app = initializeApp(getFirebaseConfig());
  const auth = getAuth(app);
  const db = getFirestore(app);
  const teacher = await signInOrCreateTeacher(auth);
  const teacherId = teacher.uid;
  const batch = writeBatch(db);

  setBatchData(batch, db, "rooms/room_math_001", {
    id: "room_math_001",
    teacher_id: teacherId,
    name: "数学I 二次関数",
    invite_code: "MATH7K",
    active_section_id: "section_math_001_intro",
    is_active: true,
    question_count: 4,
    created_at: timestamp("2026-06-23T09:00:00+09:00"),
    updated_at: timestamp("2026-06-23T09:20:00+09:00"),
    closed_at: null,
  });

  setBatchData(batch, db, "rooms/room_history_001", {
    id: "room_history_001",
    teacher_id: teacherId,
    name: "日本史 鎌倉時代",
    invite_code: "HIST5R",
    active_section_id: null,
    is_active: false,
    question_count: 2,
    created_at: timestamp("2026-06-20T10:00:00+09:00"),
    updated_at: timestamp("2026-06-20T11:30:00+09:00"),
    closed_at: timestamp("2026-06-20T11:30:00+09:00"),
  });

  setBatchData(batch, db, "inviteCodes/MATH7K", {
    invite_code: "MATH7K",
    room_id: "room_math_001",
    created_at: timestamp("2026-06-23T09:00:00+09:00"),
  });

  setBatchData(batch, db, "inviteCodes/HIST5R", {
    invite_code: "HIST5R",
    room_id: "room_history_001",
    created_at: timestamp("2026-06-20T10:00:00+09:00"),
  });

  setBatchData(
    batch,
    db,
    "rooms/room_math_001/sections/section_math_001_intro",
    {
      id: "section_math_001_intro",
      room_id: "room_math_001",
      name: "導入: 放物線の形",
      order: 1,
      is_completed: false,
      question_count: 2,
      reaction_count: 3,
      summary_id: null,
      created_at: timestamp("2026-06-23T09:05:00+09:00"),
      completed_at: null,
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_math_001/sections/section_math_001_basic",
    {
      id: "section_math_001_basic",
      room_id: "room_math_001",
      name: "基本: 平方完成",
      order: 2,
      is_completed: true,
      question_count: 1,
      reaction_count: 1,
      summary_id: "summary_math_001_basic",
      created_at: timestamp("2026-06-23T09:25:00+09:00"),
      completed_at: timestamp("2026-06-23T09:45:00+09:00"),
    },
  );

  setBatchData(batch, db, "rooms/room_math_001/questions/question_math_001", {
    id: "question_math_001",
    room_id: "room_math_001",
    section_id: "section_math_001_intro",
    content: "放物線が上に開くか下に開くかはどこを見ればいいですか？",
    student_session_id: "student_session_a",
    reaction_count: 2,
    created_at: timestamp("2026-06-23T09:10:00+09:00"),
  });

  setBatchData(batch, db, "rooms/room_math_001/questions/question_math_002", {
    id: "question_math_002",
    room_id: "room_math_001",
    section_id: "section_math_001_intro",
    content: "グラフの頂点は式からすぐ分かりますか？",
    student_session_id: "student_session_b",
    reaction_count: 1,
    created_at: timestamp("2026-06-23T09:14:00+09:00"),
  });

  setBatchData(batch, db, "rooms/room_math_001/questions/question_math_003", {
    id: "question_math_003",
    room_id: "room_math_001",
    section_id: "section_math_001_basic",
    content: "平方完成で符号を間違えやすいです。コツはありますか？",
    student_session_id: "student_session_c",
    reaction_count: 1,
    created_at: timestamp("2026-06-23T09:32:00+09:00"),
  });

  setBatchData(batch, db, "rooms/room_math_001/questions/question_math_004", {
    id: "question_math_004",
    room_id: "room_math_001",
    section_id: null,
    target_scope: "whole_class",
    content: "今日の内容全体で、テスト前に特に復習した方がよいところはどこですか？",
    student_session_id: "student_session_d",
    reaction_count: 0,
    created_at: timestamp("2026-06-23T09:38:00+09:00"),
  });

  setBatchData(
    batch,
    db,
    "rooms/room_history_001/sections/section_history_001_intro",
    {
      id: "section_history_001_intro",
      room_id: "room_history_001",
      name: "導入: 鎌倉幕府の成立",
      order: 1,
      is_completed: true,
      question_count: 2,
      reaction_count: 1,
      summary_id: null,
      created_at: timestamp("2026-06-20T10:05:00+09:00"),
      completed_at: timestamp("2026-06-20T10:45:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_history_001/questions/question_history_001",
    {
      id: "question_history_001",
      room_id: "room_history_001",
      section_id: "section_history_001_intro",
      content: "御恩と奉公の関係が少し混乱しています。具体例はありますか？",
      student_session_id: "student_session_d",
      reaction_count: 1,
      created_at: timestamp("2026-06-20T10:18:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_history_001/questions/question_history_002",
    {
      id: "question_history_002",
      room_id: "room_history_001",
      section_id: "section_history_001_intro",
      content: "源頼朝が幕府を開いた年は1192年と1185年のどちらで覚えるべきですか？",
      student_session_id: "student_session_e",
      reaction_count: 0,
      created_at: timestamp("2026-06-20T10:27:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_math_001/questions/question_math_001/reactions/student_session_b",
    {
      student_session_id: "student_session_b",
      created_at: timestamp("2026-06-23T09:15:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_math_001/questions/question_math_001/reactions/student_session_c",
    {
      student_session_id: "student_session_c",
      created_at: timestamp("2026-06-23T09:16:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_math_001/questions/question_math_002/reactions/student_session_a",
    {
      student_session_id: "student_session_a",
      created_at: timestamp("2026-06-23T09:18:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_math_001/questions/question_math_003/reactions/student_session_a",
    {
      student_session_id: "student_session_a",
      created_at: timestamp("2026-06-23T09:36:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_history_001/questions/question_history_001/reactions/student_session_e",
    {
      student_session_id: "student_session_e",
      created_at: timestamp("2026-06-20T10:30:00+09:00"),
    },
  );

  setBatchData(
    batch,
    db,
    "rooms/room_math_001/summaries/summary_math_001_basic",
    {
      id: "summary_math_001_basic",
      room_id: "room_math_001",
      section_id: "section_math_001_basic",
      content:
        "平方完成の符号ミスに関する質問がありました。特に、定数項を移動するときと、括弧の外に出す値の扱いで混乱が見られます。",
      categories: [
        {
          title: "平方完成の手順",
          question_count: 1,
        },
        {
          title: "符号ミスの防止",
          question_count: 1,
        },
      ],
      created_at: timestamp("2026-06-23T09:46:00+09:00"),
    },
  );

  await batch.commit();

  console.log(`Seed completed. teacher_id=${teacherId}`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});

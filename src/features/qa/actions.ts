"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function askQuestion(productId: string, questionText: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return {
      error: "Please sign in to ask a question.",
      requireLogin: true,
    };
  }

  const adminClient = createAdminClient();

  // Fetch author profile
  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const customerName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Customer";

  const { data: question, error } = await adminClient
    .from("questions")
    .insert({
      product_id: productId,
      user_id: user.id,
      question: questionText.trim(),
      status: "published",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/products`);
  return {
    success: true,
    question: {
      ...question,
      profiles: {
        full_name: customerName,
        email: user.email,
      },
    },
  };
}

export async function getProductQA(productId: string) {
  const adminClient = createAdminClient();

  const { data: questions, error } = await adminClient
    .from("questions")
    .select(`
      id,
      question,
      status,
      created_at,
      user_id,
      profiles (
        full_name,
        email
      ),
      answers (
        id,
        answer,
        is_official,
        created_at
      )
    `)
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching product QA:", error);
    return [];
  }

  return (questions || []).map((q: any) => {
    const prof = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    const resolvedName = prof?.full_name || prof?.email?.split("@")[0] || null;
    return {
      ...q,
      profiles: {
        full_name: resolvedName,
        email: prof?.email || null,
      },
      answers: (q.answers || []).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    };
  });
}

export async function getAdminQA() {
  const adminClient = createAdminClient();

  const { data: questions, error } = await adminClient
    .from("questions")
    .select(`
      id,
      question,
      status,
      created_at,
      products (
        id,
        name,
        slug
      ),
      profiles (
        full_name,
        email
      ),
      answers (
        id,
        answer,
        is_official,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (questions || []).map((q: any) => {
    const prof = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    const resolvedName = prof?.full_name || prof?.email?.split("@")[0] || null;
    return {
      ...q,
      profiles: {
        full_name: resolvedName,
        email: prof?.email || null,
      },
    };
  });
}

export async function answerQuestion(questionId: string, answerText: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) return { error: "Authentication required" };

  const adminClient = createAdminClient();

  // Check if answer already exists for this question to update instead of creating duplicate
  const { data: existingAnswer } = await adminClient
    .from("answers")
    .select("id")
    .eq("question_id", questionId)
    .limit(1)
    .maybeSingle();

  let answerRecord;
  if (existingAnswer) {
    const { data: updated, error: updateErr } = await adminClient
      .from("answers")
      .update({
        answer: answerText.trim(),
        user_id: user.id,
        is_official: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAnswer.id)
      .select()
      .single();

    if (updateErr) return { error: updateErr.message };
    answerRecord = updated;
  } else {
    const { data: inserted, error: insertErr } = await adminClient
      .from("answers")
      .insert({
        question_id: questionId,
        user_id: user.id,
        answer: answerText.trim(),
        is_official: true,
      })
      .select()
      .single();

    if (insertErr) return { error: insertErr.message };
    answerRecord = inserted;
  }

  await adminClient
    .from("questions")
    .update({ status: "published" })
    .eq("id", questionId);

  revalidatePath("/admin/qa");
  revalidatePath("/products");
  return { success: true, answer: answerRecord };
}

export async function deleteQuestion(questionId: string) {
  const adminClient = createAdminClient();
  try {
    await adminClient.from("answers").delete().eq("question_id", questionId);
  } catch (e) {
    console.error("Error deleting question answers:", e);
  }

  const { error } = await adminClient.from("questions").delete().eq("id", questionId);
  if (error) return { error: error.message };

  revalidatePath("/admin/qa");
  revalidatePath("/products");
  return { success: true };
}

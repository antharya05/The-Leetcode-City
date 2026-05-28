import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseMaxStreak } from "@/lib/leetcode";

const LC_HEADERS = {
  "Content-Type": "application/json",
  Referer: "https://leetcode.com",
  "User-Agent": "Mozilla/5.0 (compatible; LeetCodeCity/1.0)",
};

async function fetchLCProfile(username: string) {
  const query = `
    query($username: String!) {
      matchedUser(username: $username) {
        username
        profile { realName userAvatar ranking reputation }
        submitStats {
          acSubmissionNum { difficulty count }
          totalSubmissionNum { difficulty count }
        }
        userCalendar { streak totalActiveDays }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
      }
    }
  `;
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: LC_HEADERS,
      body: JSON.stringify({ query, variables: { username } }),
    });
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const lcUsername = (body.lcUsername ?? "").trim().toLowerCase();

  if (!lcUsername || lcUsername.length < 2) {
    return NextResponse.json(
      { error: "Please enter a valid LeetCode username" },
      { status: 400 }
    );
  }

  const githubLogin = (
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  if (!githubLogin) {
    return NextResponse.json(
      { error: "No GitHub username found in profile" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // 1. Check if user already claimed a building
  const { data: alreadyClaimed } = await admin
    .from("developers")
    .select("github_login, lc_username")
    .eq("claimed_by", user.id)
    .maybeSingle();

  if (alreadyClaimed) {
    return NextResponse.json(
      {
        error: alreadyClaimed.lc_username
          ? `You already linked @${alreadyClaimed.lc_username}`
          : "You already claimed a building",
        linked: true,
        lcUsername: alreadyClaimed.lc_username ?? alreadyClaimed.github_login,
      },
      { status: 409 }
    );
  }

  // 2. Try to find the LeetCode user in the developers table
  let { data: existing } = await admin
    .from("developers")
    .select("id, github_login, claimed, claimed_by")
    .eq("github_login", lcUsername)
    .maybeSingle();

  // 3. If not in DB, fetch from LC API and create a new row
  if (!existing) {
    const lcData = await fetchLCProfile(lcUsername);

    if (!lcData?.matchedUser) {
      return NextResponse.json(
        { error: `LeetCode user @${lcUsername} not found or profile is private` },
        { status: 404 }
      );
    }

    const u = lcData.matchedUser;
    const acNums = u.submitStats?.acSubmissionNum ?? [];
    const totNums = u.submitStats?.totalSubmissionNum ?? [];
    const getAC = (d: string) => acNums.find((x: { difficulty: string; count: number }) => x.difficulty === d)?.count ?? 0;
    const getTot = (d: string) => totNums.find((x: { difficulty: string; count: number }) => x.difficulty === d)?.count ?? 1;

    const totalSolved = getAC("All");
    const totalSub = getTot("All");
    const activeDays = u.userCalendar?.totalActiveDays ?? 0;
    const lcRank = u.profile?.ranking ?? 999999;
    const streak = parseMaxStreak(u, new Date().getFullYear()) || u.userCalendar?.streak || 0;
    const realName = u.profile?.realName?.trim() || u.username;
    const litPercentage = Math.min(1.0, Math.max(0.1, activeDays / 365));

    // Generate virtual github_id for compatibility
    let hash = 0;
    for (const ch of lcUsername) hash = (Math.imul(31, hash) + ch.charCodeAt(0)) | 0;

    const { data: inserted, error: insertError } = await admin
      .from("developers")
      .insert({
        github_login: lcUsername,
        github_id: Math.abs(hash),
        name: realName,
        avatar_url: u.profile?.userAvatar || "",
        contributions: Math.max(1, totalSolved),
        contributions_total: Math.round(litPercentage * 1000),
        total_stars: u.profile?.reputation ?? 0,
        public_repos: Math.max(0, 500000 - lcRank),
        rank: lcRank,
        lc_global_rank: lcRank,
        fetch_priority: 1,
        easy_solved: getAC("Easy"),
        medium_solved: getAC("Medium"),
        hard_solved: getAC("Hard"),
        acceptance_rate: totalSub > 0 ? Math.round((totalSolved / totalSub) * 100) / 100 : 0,
        contest_rating: Math.round(lcData?.userContestRanking?.rating ?? 0),
        contest_rank: lcData?.userContestRanking?.globalRanking ?? null,
        lc_streak: streak,
        active_days_last_year: activeDays,
        lc_username: lcUsername,
      })
      .select("id, github_login, claimed, claimed_by")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: "Failed to create building. Please try again." },
        { status: 500 }
      );
    }

    existing = inserted;
  }

  // 4. Check if already claimed by someone else
  if (existing.claimed) {
    return NextResponse.json(
      { error: `@${lcUsername} is already claimed by another user` },
      { status: 409 }
    );
  }

  // 5. Claim the building
  const { data: claimed, error: claimError } = await admin
    .from("developers")
    .update({
      claimed: true,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      fetch_priority: 1,
      lc_username: lcUsername,
    })
    .eq("id", existing.id)
    .eq("claimed", false)
    .is("claimed_by", null)
    .select("github_login, lc_username")
    .single();

  if (claimError || !claimed) {
    return NextResponse.json(
      { error: "Building not found or already claimed" },
      { status: 404 }
    );
  }

  // 6. Insert feed event
  await admin.from("activity_feed").insert({
    event_type: "building_claimed",
    actor_id: existing.id,
    metadata: { login: lcUsername, linked_via: "manual_link" },
  });

  return NextResponse.json({
    success: true,
    lcUsername: claimed.lc_username ?? claimed.github_login,
  });
}
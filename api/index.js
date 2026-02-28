const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Fetch Codeforces rating live
function getCodeforcesRating(handle) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'codeforces.com',
      path: `/api/user.info?handles=${handle}`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK') {
            resolve({
              rating: json.result[0].rating || 'Unrated',
              maxRating: json.result[0].maxRating || 'Unrated',
              rank: json.result[0].rank || 'Unrated',
              maxRank: json.result[0].maxRank || 'Unrated',
            });
          } else resolve({ rating: '', maxRating: '', rank: '', maxRank: '' });
        } catch { resolve({ rating: '', maxRating: '', rank: '', maxRank: '' }); }
      });
    });
    req.on('error', () => resolve({ rating: '', maxRating: '', rank: '', maxRank: '' }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ rating: '', maxRating: '', rank: '', maxRank: '' }); });
    req.end();
  });
}

function getLeetCodeStats(username) {
  return new Promise((resolve) => {
    const query = JSON.stringify({
      query: `query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats { acSubmissionNum { difficulty count } }
          profile { ranking }
        }
      }`,
      variables: { username }
    });
    const options = {
      hostname: 'leetcode.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(query),
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://leetcode.com'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const stats = json.data.matchedUser.submitStats.acSubmissionNum;
          const total = stats.find(s => s.difficulty === 'All')?.count || 0;
          const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
          const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
          const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
          const ranking = json.data.matchedUser.profile.ranking;
          resolve({ total, easy, medium, hard, ranking });
        } catch { resolve({ total: '', easy: '', medium: '', hard: '', ranking: '' }); }
      });
    });
    req.on('error', () => resolve({ total: '', easy: '', medium: '', hard: '', ranking: '' }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ total: '', easy: '', medium: '', hard: '', ranking: '' }); });
    req.write(query);
    req.end();
  });
}

function generateHTML(cf, lc) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Shashwat Kr Gupta  Agentic AI Engineer</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;600&display=swap" rel="stylesheet"/>
<style>
  :root {
    --black: #020408;
    --deep: #050d1a;
    --blue: #0078d4;
    --azure: #00b4ff;
    --cyan: #00d4ff;
    --glow: #00aaff;
    --electric: #40c8ff;
    --dim: #0a1628;
    --card: #071222;
    --border: rgba(0,180,255,0.15);
    --text: #c8e4f8;
    --muted: #4a7a9b;
    --white: #e8f4ff;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: var(--black);
    color: var(--text);
    font-family: 'Rajdhani', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }

  /* Custom cursor */
  .cursor {
    position: fixed;
    width: 8px; height: 8px;
    background: var(--azure);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.1s;
    box-shadow: 0 0 10px var(--azure), 0 0 20px var(--azure);
  }
  .cursor-ring {
    position: fixed;
    width: 32px; height: 32px;
    border: 1px solid rgba(0,180,255,0.5);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    transition: all 0.15s ease;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--black); }
  ::-webkit-scrollbar-thumb { background: var(--blue); border-radius: 2px; }

  /* Neural network canvas */
  #neural-bg {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 0;
    opacity: 0.25;
  }

  /* Grid overlay */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,120,212,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,120,212,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: 1;
    pointer-events: none;
  }

  /* NAV */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 4rem;
    background: rgba(2,4,8,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: 'Orbitron', monospace;
    font-size: 1.1rem;
    font-weight: 900;
    color: var(--azure);
    letter-spacing: 0.2em;
    text-shadow: 0 0 20px var(--azure);
  }
  .nav-logo span { color: var(--white); }

  .nav-links {
    display: flex;
    gap: 2.5rem;
    list-style: none;
  }

  .nav-links a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    text-decoration: none;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    transition: color 0.3s, text-shadow 0.3s;
  }
  .nav-links a:hover {
    color: var(--azure);
    text-shadow: 0 0 10px var(--azure);
  }

  /* SECTIONS */
  section {
    position: relative;
    z-index: 2;
    padding: 7rem 4rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.3em;
    color: var(--azure);
    text-transform: uppercase;
    margin-bottom: 0.6rem;
    opacity: 0.8;
  }

  .section-title {
    font-family: 'Orbitron', monospace;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    font-weight: 900;
    color: var(--white);
    line-height: 1.1;
    margin-bottom: 0.5rem;
  }

  .section-title .accent { color: var(--azure); }

  .section-line {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, var(--azure), transparent);
    margin: 1.5rem 0 3rem;
  }

  /* HERO */
  #hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding-top: 0;
    max-width: 100%;
    padding-left: 8rem;
    padding-right: 4rem;
  }

  .hero-inner {
    position: relative;
    z-index: 2;
    max-width: 800px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    border: 1px solid rgba(0,180,255,0.3);
    border-radius: 2px;
    background: rgba(0,120,212,0.08);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: var(--azure);
    text-transform: uppercase;
    margin-bottom: 2rem;
    animation: fadeInDown 0.8s ease both;
  }

  .hero-badge::before {
    content: '';
    width: 6px; height: 6px;
    background: var(--azure);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--azure);
    animation: pulse 2s ease infinite;
  }

  .hero-name {
    font-family: 'Orbitron', monospace;
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 900;
    color: var(--white);
    line-height: 1.0;
    margin-bottom: 0.8rem;
    animation: fadeInUp 0.8s 0.2s ease both;
  }

  .hero-name .line2 {
    color: transparent;
    -webkit-text-stroke: 1px var(--azure);
    filter: drop-shadow(0 0 15px rgba(0,180,255,0.4));
  }

  .hero-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--azure);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin-bottom: 2rem;
    animation: fadeInUp 0.8s 0.3s ease both;
  }

  .hero-bio {
    font-size: 1.1rem;
    font-weight: 400;
    color: var(--text);
    line-height: 1.8;
    max-width: 600px;
    margin-bottom: 3rem;
    animation: fadeInUp 0.8s 0.4s ease both;
  }

  .hero-bio .highlight {
    color: var(--azure);
    font-weight: 600;
  }

  .hero-cta {
    display: flex;
    gap: 1.2rem;
    flex-wrap: wrap;
    animation: fadeInUp 0.8s 0.5s ease both;
  }

  .btn-primary {
    padding: 0.85rem 2.2rem;
    background: linear-gradient(135deg, var(--blue), var(--azure));
    color: var(--black);
    font-family: 'Orbitron', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    text-decoration: none;
    border: none;
    cursor: pointer;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,120,212,0.5);
  }

  .btn-secondary {
    padding: 0.85rem 2.2rem;
    background: transparent;
    color: var(--azure);
    font-family: 'Orbitron', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    text-decoration: none;
    border: 1px solid rgba(0,180,255,0.4);
    cursor: pointer;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    transition: all 0.3s;
  }

  .btn-secondary:hover {
    background: rgba(0,180,255,0.08);
    border-color: var(--azure);
    box-shadow: 0 0 20px rgba(0,180,255,0.2);
  }

  /* Floating HUD elements */
  .hud-element {
    position: absolute;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: rgba(0,180,255,0.3);
    letter-spacing: 0.1em;
    animation: float 6s ease-in-out infinite;
  }

  .hud-1 { top: 20%; right: 8%; animation-delay: 0s; }
  .hud-2 { bottom: 25%; right: 12%; animation-delay: 2s; }
  .hud-3 { top: 45%; right: 5%; animation-delay: 4s; }

  .hud-box {
    border: 1px solid rgba(0,180,255,0.15);
    padding: 0.8rem 1.2rem;
    background: rgba(0,20,40,0.6);
    backdrop-filter: blur(10px);
    line-height: 1.8;
    min-width: 160px;
  }

  .hud-box .hud-label { color: var(--azure); margin-bottom: 0.3rem; }

  /* ABOUT */
  .about-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
  }

  .about-text p {
    font-size: 1.05rem;
    line-height: 1.9;
    color: var(--text);
    margin-bottom: 1.2rem;
  }

  .about-text p .hi { color: var(--azure); font-weight: 600; }

  .about-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .stat-card {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.3s;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    background: linear-gradient(180deg, var(--azure), transparent);
  }

  .stat-card:hover {
    border-color: rgba(0,180,255,0.4);
    transform: translateY(-3px);
  }

  .stat-number {
    font-family: 'Orbitron', monospace;
    font-size: 2rem;
    font-weight: 900;
    color: var(--azure);
    text-shadow: 0 0 15px rgba(0,180,255,0.5);
    line-height: 1;
    margin-bottom: 0.3rem;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--muted);
    text-transform: uppercase;
  }

  /* SKILLS */
  .skills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .skill-category {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 1.8rem;
    position: relative;
    transition: all 0.3s;
  }

  .skill-category:hover {
    border-color: rgba(0,180,255,0.35);
    box-shadow: 0 0 30px rgba(0,120,212,0.1);
  }

  .skill-cat-icon {
    font-size: 1.8rem;
    margin-bottom: 0.8rem;
    display: block;
  }

  .skill-cat-name {
    font-family: 'Orbitron', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--azure);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 1.2rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--border);
  }

  .skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .skill-tag {
    padding: 0.25rem 0.75rem;
    background: rgba(0,120,212,0.08);
    border: 1px solid rgba(0,120,212,0.2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: var(--electric);
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }

  .skill-tag:hover {
    background: rgba(0,180,255,0.15);
    border-color: var(--azure);
    color: var(--white);
  }

  /* PROJECTS */
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 2rem;
  }

  .project-card {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 2.5rem;
    position: relative;
    overflow: hidden;
    transition: all 0.4s;
    cursor: pointer;
  }

  .project-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, var(--blue), var(--azure), transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s;
  }

  .project-card:hover::after { transform: scaleX(1); }
  .project-card:hover {
    border-color: rgba(0,180,255,0.3);
    transform: translateY(-5px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,120,212,0.1);
  }

  .project-number {
    font-family: 'Orbitron', monospace;
    font-size: 0.6rem;
    color: rgba(0,180,255,0.3);
    letter-spacing: 0.2em;
    margin-bottom: 1.5rem;
  }

  .project-icon-wrap {
    width: 52px; height: 52px;
    background: rgba(0,120,212,0.1);
    border: 1px solid rgba(0,120,212,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s;
  }

  .project-card:hover .project-icon-wrap {
    background: rgba(0,180,255,0.15);
    border-color: var(--azure);
    box-shadow: 0 0 20px rgba(0,180,255,0.2);
  }

  .project-title {
    font-family: 'Orbitron', monospace;
    font-size: 1rem;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 1rem;
    line-height: 1.3;
  }

  .project-desc {
    font-size: 0.95rem;
    line-height: 1.7;
    color: var(--muted);
    margin-bottom: 1.5rem;
  }

  .project-tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .tech-pill {
    padding: 0.2rem 0.6rem;
    background: rgba(0,60,120,0.3);
    border: 1px solid rgba(0,120,212,0.2);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: var(--azure);
    letter-spacing: 0.05em;
  }

  /* EXPERIENCE */
  .exp-timeline {
    position: relative;
    padding-left: 2rem;
  }

  .exp-timeline::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 1px;
    background: linear-gradient(180deg, var(--azure), rgba(0,180,255,0.1));
  }

  .exp-item {
    position: relative;
    padding: 0 0 3rem 2.5rem;
  }

  .exp-dot {
    position: absolute;
    left: -0.45rem;
    top: 0.2rem;
    width: 10px; height: 10px;
    background: var(--azure);
    border-radius: 50%;
    box-shadow: 0 0 12px var(--azure);
  }

  .exp-dot::after {
    content: '';
    position: absolute;
    inset: -4px;
    border: 1px solid rgba(0,180,255,0.3);
    border-radius: 50%;
    animation: pulse 2s ease infinite;
  }

  .exp-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: var(--azure);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .exp-role {
    font-family: 'Orbitron', monospace;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 0.3rem;
  }

  .exp-company {
    font-size: 0.95rem;
    color: var(--azure);
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .exp-desc {
    font-size: 0.95rem;
    line-height: 1.7;
    color: var(--muted);
  }

  /* COMPETITIVE CODING */
  .coding-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .coding-platform {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 2.5rem;
    position: relative;
    overflow: hidden;
    transition: all 0.3s;
  }

  .coding-platform:hover {
    border-color: rgba(0,180,255,0.35);
    box-shadow: 0 0 40px rgba(0,120,212,0.12);
  }

  .platform-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1.2rem;
    border-bottom: 1px solid var(--border);
  }

  .platform-logo {
    width: 42px; height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    background: rgba(0,120,212,0.1);
    border: 1px solid rgba(0,120,212,0.25);
  }

  .platform-name {
    font-family: 'Orbitron', monospace;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--white);
  }
  .platform-handle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: var(--azure);
    margin-top: 0.2rem;
  }

  .coding-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .coding-stat {
    text-align: center;
    padding: 1rem;
    background: rgba(0,60,120,0.15);
    border: 1px solid rgba(0,120,212,0.12);
  }

  .coding-stat-value {
    font-family: 'Orbitron', monospace;
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--azure);
    text-shadow: 0 0 12px rgba(0,180,255,0.5);
    line-height: 1;
    margin-bottom: 0.3rem;
  }

  .coding-stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .lc-breakdown {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
    margin-top: 1rem;
  }

  .lc-diff {
    text-align: center;
    padding: 0.7rem 0.5rem;
    background: rgba(0,60,120,0.15);
    border: 1px solid rgba(0,120,212,0.12);
  }

  .lc-diff-val {
    font-family: 'Orbitron', monospace;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.2rem;
  }

  .easy-val { color: #4ade80; }
  .medium-val { color: #facc15; }
  .hard-val { color: #f87171; }

  .lc-diff-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    color: var(--muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* BLOG */
  .blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .blog-card {
    background: var(--card);
    border: 1px solid var(--border);
    padding: 2rem;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .blog-card:hover {
    border-color: rgba(0,180,255,0.3);
    transform: translateY(-3px);
  }

  .blog-tag {
    display: inline-block;
    padding: 0.2rem 0.7rem;
    background: rgba(0,120,212,0.1);
    border: 1px solid rgba(0,120,212,0.25);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    color: var(--azure);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .blog-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--white);
    line-height: 1.4;
    margin-bottom: 0.8rem;
  }

  .blog-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: var(--muted);
    letter-spacing: 0.08em;
  }

  /* CONTACT */
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: start;
  }

  .contact-text {
    font-size: 1.05rem;
    line-height: 1.9;
    color: var(--text);
    margin-bottom: 2.5rem;
  }

  .social-links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .social-link {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1rem 1.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    text-decoration: none;
    transition: all 0.3s;
    color: var(--text);
  }

  .social-link:hover {
    border-color: rgba(0,180,255,0.4);
    background: rgba(0,120,212,0.08);
    transform: translateX(6px);
  }

  .social-icon {
    width: 36px; height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    background: rgba(0,120,212,0.15);
    border: 1px solid rgba(0,120,212,0.2);
    flex-shrink: 0;
  }

  .social-info-name {
    font-family: 'Orbitron', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--azure);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .social-info-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 0.2rem;
  }

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem;
    color: var(--azure);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .form-input, .form-textarea {
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--white);
    padding: 0.85rem 1.2rem;
    font-family: 'Rajdhani', sans-serif;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.3s;
    resize: none;
  }

  .form-input:focus, .form-textarea:focus {
    border-color: rgba(0,180,255,0.5);
    box-shadow: 0 0 0 1px rgba(0,180,255,0.1);
  }

  .form-textarea { height: 120px; }

  /* FOOTER */
  footer {
    position: relative;
    z-index: 2;
    border-top: 1px solid var(--border);
    padding: 2rem 4rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(2,4,8,0.8);
  }

  .footer-left {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  .footer-left span { color: var(--azure); }

  /* ANIMATIONS */
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  @keyframes scanline {
    0% { top: -2px; }
    100% { top: 100%; }
  }

  /* Scan line effect on cards */
  .project-card::before, .coding-platform::before {
    content: '';
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0,180,255,0.15), transparent);
    top: -2px;
    animation: scanline 4s linear infinite;
    pointer-events: none;
  }

  /* Reveal on scroll */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: none;
  }

  /* Responsive */
  @media (max-width: 768px) {
    nav { padding: 1rem 1.5rem; }
    .nav-links { display: none; }
    section { padding: 5rem 1.5rem; }
    #hero { padding: 5rem 1.5rem; }
    .hero-name { font-size: 2.5rem; }
    .about-grid, .coding-grid, .contact-grid { grid-template-columns: 1fr; gap: 2rem; }
    footer { flex-direction: column; gap: 0.5rem; text-align: center; padding: 1.5rem; }
  }
</style>
</head>
<body>

<div class="cursor" id="cursor"></div>
<div class="cursor-ring" id="cursorRing"></div>

<canvas id="neural-bg"></canvas>

<!-- NAV -->
<nav>
  <div class="nav-logo">SKG<span>.</span></div>
  <ul class="nav-links">
    <li><a href="#about">About</a></li>
    <li><a href="#skills">Skills</a></li>
    <li><a href="#projects">Projects</a></li>
    <li><a href="#experience">Experience</a></li>
    <li><a href="#competitive">Competitive</a></li>
    <li><a href="#blog">Blog</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>

<!-- HERO -->
<div style="position:relative;z-index:2;" id="hero-wrap">
<section id="hero">
  <div class="hero-inner">
    <div class="hero-badge"> Available for opportunities</div>
    <h1 class="hero-name">
      SHASHWAT<br/>
      <span class="line2">KR GUPTA</span>
    </h1>
    <div class="hero-title">Associate Software Engineer</div>
    <p class="hero-bio">
      I build <span class="highlight">autonomous AI systems</span> that think, plan, and act  
      orchestrating intelligent agents over <span class="highlight">Azure</span> to solve hyperscale enterprise problems. 
      From <span class="highlight">LangGraph</span> agent pipelines to semantic data intelligence, 
      I'm at the frontier where code meets cognition.
    </p>
    <div class="hero-cta">
      <a href="#projects" class="btn-primary">View Projects</a>
      <a href="#contact" class="btn-secondary">Get in Touch</a>
    </div>
  </div>

  <!-- HUD elements -->
  <div class="hud-element hud-1">
    <div class="hud-box">
      <div class="hud-label">// CURRENT STACK</div>
      <div>LangGraph + Azure</div>
      <div>Agentic AI Systems</div>
      <div>FastAPI + Node.js</div>
    </div>
  </div>
  <div class="hud-element hud-2">
    <div class="hud-box">
      <div class="hud-label">// STATUS</div>
      <div>@ MAQ Software</div>
      <div>Building AI Agents</div>
    </div>
  </div>
</section>
</div>

<!-- ABOUT -->
<section id="about">
  <div class="section-tag">01 // about</div>
  <h2 class="section-title">Who I <span class="accent">Am</span></h2>
  <div class="section-line"></div>

  <div class="about-grid reveal">
    <div class="about-text">
      <p>
        I'm a <span class="hi">software engineer at MAQ Software</span> who refused to build ordinary software. 
        Instead, I architect AI systems that <em>act</em>  agents that don't just respond to queries, 
        but reason through complex problems, use tools, and deliver outcomes at scale.
      </p>
      <p>
        My focus is at the intersection of <span class="hi">Agentic AI</span> and <span class="hi">Azure's cloud intelligence</span>  
        designing multi-agent systems with LangGraph, wiring knowledge pipelines with RAG, 
        and building semantic layers that turn raw data into natural conversation.
      </p>
      <p>
        When I'm not shipping agents, I'm grinding competitive programming on Codeforces & LeetCode  
        because the algorithmic sharpness it builds is the same muscle that makes great AI systems.
      </p>
    </div>
    <div class="about-stats">
      <div class="stat-card">
        <div class="stat-number">4+</div>
        <div class="stat-label">Months at MAQ</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">2</div>
        <div class="stat-label">AI Agents Shipped</div>
      </div>
      <div class="stat-card">
        <div class="stat-number"></div>
        <div class="stat-label">Tokens Processed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">01</div>
        <div class="stat-label">Mission: AGI Tooling</div>
      </div>
    </div>
  </div>
</section>

<!-- SKILLS -->
<section id="skills">
  <div class="section-tag">02 // skills</div>
  <h2 class="section-title">Tech <span class="accent">Arsenal</span></h2>
  <div class="section-line"></div>

  <div class="skills-grid reveal">
    <div class="skill-category">
      <span class="skill-cat-icon"></span>
      <div class="skill-cat-name">Agentic AI</div>
      <div class="skill-tags">
        <span class="skill-tag">LangGraph</span>
        <span class="skill-tag">LangChain</span>
        <span class="skill-tag">LangSmith</span>
        <span class="skill-tag">Semantic Kernel</span>
        <span class="skill-tag">n8n</span>
        <span class="skill-tag">RAG</span>
        <span class="skill-tag">AutoGen</span>
      </div>
    </div>
    <div class="skill-category">
      <span class="skill-cat-icon"></span>
      <div class="skill-cat-name">Azure Cloud</div>
      <div class="skill-tags">
        <span class="skill-tag">Azure OpenAI</span>
        <span class="skill-tag">Azure AI Foundry</span>
        <span class="skill-tag">Azure Functions</span>
        <span class="skill-tag">Azure Cognitive Search</span>
        <span class="skill-tag">Azure Storage</span>
      </div>
    </div>
    <div class="skill-category">
      <span class="skill-cat-icon"></span>
      <div class="skill-cat-name">Backend</div>
      <div class="skill-tags">
        <span class="skill-tag">Python</span>
        <span class="skill-tag">FastAPI</span>
        <span class="skill-tag">Flask</span>
        <span class="skill-tag">Node.js</span>
        <span class="skill-tag">REST APIs</span>
      </div>
    </div>
    <div class="skill-category">
      <span class="skill-cat-icon"></span>
      <div class="skill-cat-name">Frontend</div>
      <div class="skill-tags">
        <span class="skill-tag">React</span>
        <span class="skill-tag">Next.js</span>
        <span class="skill-tag">JavaScript</span>
        <span class="skill-tag">TypeScript</span>
        <span class="skill-tag">TailwindCSS</span>
      </div>
    </div>
  </div>
</section>

<!-- PROJECTS -->
<section id="projects">
  <div class="section-tag">03 // projects</div>
  <h2 class="section-title">What I've <span class="accent">Built</span></h2>
  <div class="section-line"></div>

  <div class="projects-grid reveal">
    <div class="project-card">
      <div class="project-number">PROJECT_01 //</div>
      <div class="project-icon-wrap"></div>
      <div class="project-title">Smart Store Assistant</div>
      <p class="project-desc">
        An autonomous agentic system designed for store managers, enabling hyperscale retail operations 
        through natural language. The agent orchestrates inventory management, demand forecasting, 
        supplier workflows, and analytics  all via conversational AI that acts, not just answers.
      </p>
      <div class="project-tech-stack">
        <span class="tech-pill">LangGraph</span>
        <span class="tech-pill">Azure OpenAI</span>
        <span class="tech-pill">FastAPI</span>
        <span class="tech-pill">RAG</span>
        <span class="tech-pill">Python</span>
        <span class="tech-pill">Multi-Agent</span>
      </div>
    </div>

    <div class="project-card">
      <div class="project-number">PROJECT_02 //</div>
      <div class="project-icon-wrap"></div>
      <div class="project-title">Data Agent over Semantic Model</div>
      <p class="project-desc">
        An intelligent data agent built on top of a semantic model, allowing business users to query 
        complex data in plain natural language and receive structured, formatted responses. 
        Eliminates the SQL barrier entirely  the agent understands business context, resolves 
        ambiguity, and returns board-ready insights.
      </p>
      <div class="project-tech-stack">
        <span class="tech-pill">Semantic Kernel</span>
        <span class="tech-pill">Azure AI</span>
        <span class="tech-pill">LangChain</span>
        <span class="tech-pill">Power BI</span>
        <span class="tech-pill">Python</span>
        <span class="tech-pill">NL2SQL</span>
      </div>
    </div>
  </div>
</section>

<!-- EXPERIENCE -->
<section id="experience">
  <div class="section-tag">04 // experience</div>
  <h2 class="section-title">Work <span class="accent">History</span></h2>
  <div class="section-line"></div>

  <div class="exp-timeline reveal">
    <div class="exp-item">
      <div class="exp-dot"></div>
      <div class="exp-date">Oct 2024  Present  4 Months</div>
      <div class="exp-role">Associate Software Engineer</div>
      <div class="exp-company">MAQ Software</div>
      <p class="exp-desc">
        Building production-grade agentic AI systems on Azure. Designing multi-agent pipelines 
        using LangGraph and Semantic Kernel, developing RAG-powered knowledge bases, 
        and creating intelligent data agents that convert natural language queries into 
        structured business intelligence. Working at the bleeding edge where enterprise 
        software meets autonomous AI.
      </p>
    </div>

    <div class="exp-item">
      <div class="exp-dot"></div>
      <div class="exp-date">2020  2024</div>
      <div class="exp-role">B.Tech  Computer Science</div>
      <div class="exp-company">AKTU (Dr. A.P.J. Abdul Kalam Technical University)</div>
      <p class="exp-desc">
        Studied core computer science fundamentals including data structures, algorithms, 
        operating systems, databases, and software engineering. Built a strong foundation 
        in competitive programming and began exploring AI/ML systems.
      </p>
    </div>
  </div>
</section>

<!-- COMPETITIVE CODING -->
<section id="competitive">
  <div class="section-tag">05 // competitive coding</div>
  <h2 class="section-title">Coding <span class="accent">Stats</span></h2>
  <div class="section-line"></div>

  <div class="coding-grid reveal">
    <!-- CODEFORCES -->
    <div class="coding-platform">
      <div class="platform-header">
        <div class="platform-logo"></div>
        <div>
          <div class="platform-name">Codeforces</div>
          <div class="platform-handle">@Skg_dynamic</div>
        </div>
        <a href="https://codeforces.com/profile/Skg_dynamic" target="_blank" style="margin-left:auto;" class="btn-secondary" style="padding:0.4rem 0.8rem;font-size:0.6rem;">View Profile</a>
      </div>
      <div class="coding-stats">
        <div class="coding-stat">
          <div class="coding-stat-value" id="cf-rating">${cf.rating}</div>
          <div class="coding-stat-label">Current Rating</div>
        </div>
        <div class="coding-stat">
          <div class="coding-stat-value" id="cf-max">${cf.maxRating}</div>
          <div class="coding-stat-label">Max Rating</div>
        </div>
        <div class="coding-stat" style="grid-column: span 2;">
          <div class="coding-stat-value" style="font-size:1rem;text-transform:capitalize;" id="cf-rank">${cf.rank}</div>
          <div class="coding-stat-label">Current Rank</div>
        </div>
      </div>
    </div>

    <!-- LEETCODE -->
    <div class="coding-platform">
      <div class="platform-header">
        <div class="platform-logo"></div>
        <div>
          <div class="platform-name">LeetCode</div>
          <div class="platform-handle">@skg_dynamic</div>
        </div>
        <a href="https://leetcode.com/u/skg_dynamic/" target="_blank" style="margin-left:auto;" class="btn-secondary" style="padding:0.4rem 0.8rem;font-size:0.6rem;">View Profile</a>
      </div>
      <div class="coding-stats">
        <div class="coding-stat">
          <div class="coding-stat-value" id="lc-total">${lc.total}</div>
          <div class="coding-stat-label">Problems Solved</div>
        </div>
        <div class="coding-stat">
          <div class="coding-stat-value" id="lc-rank" style="font-size:1rem;">${lc.ranking}</div>
          <div class="coding-stat-label">Global Ranking</div>
        </div>
      </div>
      <div class="lc-breakdown">
        <div class="lc-diff">
          <div class="lc-diff-val easy-val" id="lc-easy">${lc.easy}</div>
          <div class="lc-diff-name">Easy</div>
        </div>
        <div class="lc-diff">
          <div class="lc-diff-val medium-val" id="lc-med">${lc.medium}</div>
          <div class="lc-diff-name">Medium</div>
        </div>
        <div class="lc-diff">
          <div class="lc-diff-val hard-val" id="lc-hard">${lc.hard}</div>
          <div class="lc-diff-name">Hard</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- BLOG -->
<section id="blog">
  <div class="section-tag">06 // blog & articles</div>
  <h2 class="section-title">Thoughts & <span class="accent">Writing</span></h2>
  <div class="section-line"></div>

  <div class="blog-grid reveal">
    <div class="blog-card">
      <span class="blog-tag">Agentic AI</span>
      <div class="blog-title">Building Production-Grade LangGraph Agents: Lessons from the Trenches</div>
      <div class="blog-meta">Coming Soon  placeholder</div>
    </div>
    <div class="blog-card">
      <span class="blog-tag">Azure</span>
      <div class="blog-title">Why Azure AI Foundry is Changing How We Deploy LLM Systems</div>
      <div class="blog-meta">Coming Soon  placeholder</div>
    </div>
    <div class="blog-card">
      <span class="blog-tag">RAG</span>
      <div class="blog-title">RAG is Not Enough  Building Semantic Intelligence Over Enterprise Data</div>
      <div class="blog-meta">Coming Soon  placeholder</div>
    </div>
  </div>
  <p style="margin-top:2rem; font-family: 'JetBrains Mono', monospace; font-size:0.7rem; color:var(--muted);">
    // Articles coming soon  follow me on LinkedIn for updates
  </p>
</section>

<!-- CONTACT -->
<section id="contact">
  <div class="section-tag">07 // contact</div>
  <h2 class="section-title">Let's <span class="accent">Connect</span></h2>
  <div class="section-line"></div>

  <div class="contact-grid reveal">
    <div>
      <p class="contact-text">
        Whether you're building the next generation of AI systems, have a challenging agent architecture problem, 
        or just want to talk about the future of autonomous intelligence  my inbox is always open.
      </p>

      <div class="social-links">
        <a href="https://www.linkedin.com/in/shashwat82/" target="_blank" class="social-link">
          <div class="social-icon"></div>
          <div>
            <div class="social-info-name">LinkedIn</div>
            <div class="social-info-val">linkedin.com/in/shashwat82</div>
          </div>
        </a>
        <a href="https://github.com/Shashwat-Gupta123" target="_blank" class="social-link">
          <div class="social-icon"></div>
          <div>
            <div class="social-info-name">GitHub</div>
            <div class="social-info-val">github.com/Shashwat-Gupta123</div>
          </div>
        </a>
        <a href="https://codeforces.com/profile/Skg_dynamic" target="_blank" class="social-link">
          <div class="social-icon"></div>
          <div>
            <div class="social-info-name">Codeforces</div>
            <div class="social-info-val">Skg_dynamic</div>
          </div>
        </a>
        <a href="https://leetcode.com/u/skg_dynamic/" target="_blank" class="social-link">
          <div class="social-icon"></div>
          <div>
            <div class="social-info-name">LeetCode</div>
            <div class="social-info-val">skg_dynamic</div>
          </div>
        </a>
      </div>
    </div>

    <div class="contact-form">
      <div class="form-group">
        <label class="form-label">// Your Name</label>
        <input type="text" class="form-input" placeholder="Enter your name"/>
      </div>
      <div class="form-group">
        <label class="form-label">// Email</label>
        <input type="email" class="form-input" placeholder="your@email.com"/>
      </div>
      <div class="form-group">
        <label class="form-label">// Message</label>
        <textarea class="form-textarea" placeholder="What's on your mind?"></textarea>
      </div>
      <button class="btn-primary" style="align-self:flex-start;" onclick="alert('Message feature  connect your mailer (Nodemailer/SendGrid) here!')">Send Message</button>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-left">
     2025 <span>Shashwat Kr Gupta</span>  Built with Node.js  Powered by <span>Agentic AI</span>
  </div>
  <div class="footer-left">
    <span>SKG</span>_DYNAMIC // ASSOCIATE_SOFTWARE_ENGINEER @ MAQ_SOFTWARE
  </div>
</footer>

<script>
// Custom Cursor
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX - 4 + 'px';
  cursor.style.top = mouseY - 4 + 'px';
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.15;
  ringY += (mouseY - ringY) * 0.15;
  cursorRing.style.left = ringX - 16 + 'px';
  cursorRing.style.top = ringY - 16 + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, button, .project-card, .skill-tag').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'scale(2.5)';
    cursorRing.style.transform = 'scale(1.5)';
    cursorRing.style.borderColor = 'rgba(0,180,255,0.8)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'scale(1)';
    cursorRing.style.transform = 'scale(1)';
    cursorRing.style.borderColor = 'rgba(0,180,255,0.5)';
  });
});

// Neural Network Animation
const canvas = document.getElementById('neural-bg');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

class Node {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r = Math.random() * 2 + 1;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.pulsePhase += 0.02;
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }
  draw() {
    const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * (0.7 + pulse * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = \`rgba(0, 180, 255, \${0.4 + pulse * 0.4})\`;
    ctx.fill();
  }
}

const nodes = Array.from({ length: 80 }, () => new Node());

function drawNeural() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 150) {
        const alpha = (1 - dist / 150) * 0.35;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = \`rgba(0, 120, 212, \${alpha})\`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  nodes.forEach(n => { n.update(); n.draw(); });
  requestAnimationFrame(drawNeural);
}
drawNeural();

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => revealObserver.observe(el));

// Smooth nav highlight
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 200) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.style.color = link.getAttribute('href') === '#' + current ? 'var(--azure)' : '';
    link.style.textShadow = link.getAttribute('href') === '#' + current ? '0 0 10px var(--azure)' : '';
  });
});
</script>
</body>
</html>`;
}

app.get(['/', '/index.html'], async (req, res) => {
  try {
    const [cf, lc] = await Promise.all([
      getCodeforcesRating('Skg_dynamic'),
      getLeetCodeStats('skg_dynamic')
    ]);
    res.send(generateHTML(cf, lc));
  } catch (e) {
    res.send(generateHTML(
      { rating: '', maxRating: '', rank: '' },
      { total: '', easy: '', medium: '', hard: '', ranking: '' }
    ));
  }
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Handle 404
app.use((req, res) => {
  res.status(404).send('Not found');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n Portfolio running at: http://localhost:${PORT}\n`);
  });
}

module.exports = app;

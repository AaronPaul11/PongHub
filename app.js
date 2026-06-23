console.log("app.js is connected");

function renderLeaderboard(players) {
  players.sort((a, b) => b.elo - a.elo);

  let rowsHtml = "";
  players.forEach((player, index) => {
    rowsHtml += `
      <tr>
        <td>${index+1}</td>
        <td>${player.name}</td>
        <td>${Math.round(player.elo)}</td>
        <td>${player.wins}</td>
        <td>${player.losses}</td>
        <td><button class="delete-btn" data-id="${player.id}" style="display: ${window.isAdmin ? 'inline' : 'none'}">Delete</button></td>
      </tr>
    `;
  });

  const tableHtml = `
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Elo</th>
          <th>Wins</th>
          <th>Losses</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  document.getElementById("leaderboard").innerHTML = tableHtml;
}

const K = 20; // base K-factor

function calculateElo(eloA, eloB, scoreA, scoreB) {
  // 1. Expected score for player A
  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));

  // 2. Who actually won? 1 if A won, 0 if A lost
  const actualA = scoreA > scoreB;

  // 3. Margin multiplier
  const pointDiff = Math.abs(scoreA-scoreB);
  const marginMultiplier = Math.log(pointDiff + 1);

  // 4. New rating for A
  const newEloA = eloA + K * marginMultiplier * (actualA - expectedA);

  // 5. B's change is the mirror image of A's
  const newEloB = eloB - (newEloA - eloA);

  return { newEloA, newEloB };
}


function populateDropdowns(players) {
  let optionsHtml = "";
  players.forEach(player => {
    optionsHtml += `<option value="${player.name}">${player.name}</option>`;
  });

  document.getElementById("player1").innerHTML = optionsHtml;
  document.getElementById("player2").innerHTML = optionsHtml;
}


const ADMIN_PASSWORD = "eatmyass69420";
window.isAdmin = false;

document.getElementById("admin-btn").addEventListener("click", () => {
  const attempt = prompt("Enter admin password:");
  if (attempt === ADMIN_PASSWORD) {
    window.isAdmin = true;
    document.getElementById("match-form").style.display = "block";
    document.getElementById("add-player-form").style.display = "block";
    document.getElementById("admin-btn").style.display = "none";
    renderLeaderboard(window.players);
  } else {
    alert("Wrong password.");
  }
});

document.getElementById("leaderboard").addEventListener("click", async (event) => {
  if (!event.target.classList.contains("delete-btn")) return;

  const playerId = event.target.dataset.id;
  const player = window.players.find(p => p.id === playerId);

  const confirmed = confirm(`Delete ${player.name}? This cannot be undone.`);
  if (!confirmed) return;

  await window.deleteDoc(window.doc(window.db, "players", playerId));

  const newSnapshot = await window.getDocs(window.collection(window.db, "players"));
  const newPlayers = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  window.players = newPlayers;
  renderLeaderboard(newPlayers);
  populateDropdowns(newPlayers);
});

document.getElementById("match-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const player1Name = document.getElementById("player1").value;
  const player2Name = document.getElementById("player2").value;
  const score1 = Number(document.getElementById("score1").value);
  const score2 = Number(document.getElementById("score2").value);

  if (player1Name === player2Name) {
    alert("Pick two different players.");
    return;
  }
  const player1 = window.players.find(p => p.name === player1Name);
  const player2 = window.players.find(p => p.name === player2Name);
  const result = calculateElo(player1.elo, player2.elo, score1, score2);

  await window.updateDoc(window.doc(window.db, "players", player1.id), {
    elo: result.newEloA,
    wins: score1 > score2 ? player1.wins + 1 : player1.wins,
    losses: score1 > score2 ? player1.losses : player1.losses + 1
  });

  await window.updateDoc(window.doc(window.db, "players", player2.id), {
    elo: result.newEloB,
    wins: score2 > score1 ? player2.wins + 1 : player2.wins,
    losses: score2 > score1 ? player2.losses : player2.losses + 1
  });

  const winner = score1 > score2 ? player1Name : player2Name;
  const eloChange = Math.round(Math.abs(result.newEloA - player1.elo));

  await window.addDoc(window.collection(window.db, "matches"), {
    player1: player1Name,
    player2: player2Name,
    score1: score1,
    score2: score2,
    winner: winner,
    eloChange: eloChange,
    timestamp: window.serverTimestamp()
  });

  const newSnapshot = await window.getDocs(window.collection(window.db, "players"));
  const newPlayers = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  window.players = newPlayers;
  renderLeaderboard(newPlayers);
  populateDropdowns(newPlayers);

  document.getElementById("match-form").reset();
});

document.getElementById("add-player-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const newName = document.getElementById("new-player-name").value.trim();

  if (newName === "") {
    alert("Enter a name.");
    return;
  }

  const nameExists = window.players.some(p => p.name === newName);
  if (nameExists) {
    alert("That player already exists.");
    return;
  }

  await window.addDoc(window.collection(window.db, "players"), {
    name: newName,
    elo: 1000,
    wins: 0,
    losses: 0
  });

  const newSnapshot = await window.getDocs(window.collection(window.db, "players"));
  const newPlayers = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  window.players = newPlayers;
  renderLeaderboard(newPlayers);
  populateDropdowns(newPlayers);

  document.getElementById("add-player-form").reset();
});



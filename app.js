import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-analytics.js";
import { addDoc, collection, query, orderBy, where, limit, getDocs, updateDoc, doc as docRef, getFirestore} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import config from './config.js';

const firebaseConfig = {
  apiKey: config.API_KEY,
  authDomain: config.FIREBASE_AUTH_DOMAIN,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: "fir-trivia-myaiguy.appspot.com",
  messagingSenderId: "1096428476396",
  appId: "1:1096428476396:web:bc28fae697a2e3918312c9",
  measurementId: "G-G3C2M233K5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);

// Select DOM elements
const submitAnswerBtn = document.getElementById('submit-answer');
const startGamePopup = document.querySelector('.start-game');
const nameInput = document.getElementById('Name');
const startGameBtn = document.getElementById('start-game-btn');
const questionText = document.getElementById("question");
const answerOptions = document.querySelectorAll(".answer-option");
const yourScore = document.querySelector('.score-wrapper')

// Questions and Index
let currentQuestionIndex = -1;
let shuffledQuestions = [];

// initial score
let score = 0;

// initial name
let userName = "";

// User name global variable
let correctAnswers = 0;

// Questions Per Game
const maxQuestionsPerGame = 10;
let questions = [];

// Calculating Time to Answer; initializing list
let timeToAnswerList = [];
let startTime = 15.00;

// Function to handle answer option clicks
function onAnswerOptionClick() {
  const clickedElement = event.target;

  // Check if the clicked element is the text element within the answer-option
  if (clickedElement.classList.contains("option-text")) {
    // If true, trigger the click event on the parent answer-option div
    clickedElement.parentElement.click();
    return;
  }

  // Remove the 'selected' class from any previously selected option
  document.querySelectorAll('.answer-option.selected').forEach((selectedOption) => {
    selectedOption.classList.remove('selected');
  });

  // Add the 'selected' class to the clicked option
  this.classList.add('selected');

  // Enable or disable the submit button based on whether an answer is selected
  if (document.querySelector('.answer-option.selected')) {
    submitAnswerBtn.removeAttribute('disabled');
  } else {
    submitAnswerBtn.setAttribute('disabled', '');
  }
}

function handleAnswerOptionClick(event) {
  onAnswerOptionClick.call(event.target);
}

// Calculate Average Time
// function calculateAverageTime() {
//   if (timeToAnswerList.length === 0) return 0;

//   const totalTime = timeToAnswerList.reduce((a, b) => a + b);
//   return totalTime / timeToAnswerList.length;
// }

// Attach click event listeners to answer options
document.querySelectorAll('.answer-option').forEach((option) => {
  option.addEventListener('click', handleAnswerOptionClick);
});

// Handle the submit button click event
submitAnswerBtn.addEventListener('click', () => {
  submitAnswerBtn.setAttribute('disabled', '');

  // Update the score display
  updateScoreDisplay();

  // Load the next question or end the game if all questions have been answered
  loadNextQuestion();
});

// Initialize the submit button as disabled
submitAnswerBtn.setAttribute('disabled', '');

// Function to render a question and its answer options
function renderQuestion() {
  if (currentQuestionIndex < shuffledQuestions.length) {
    const question = shuffledQuestions[currentQuestionIndex];
    questionText.textContent = question.question;

    // Shuffle the options
    const shuffledOptions = [...question.options];
    shuffle(shuffledOptions);

    answerOptions.forEach((option, index) => {
      option.querySelector(".option-text").textContent = shuffledOptions[index];
      option.dataset.option = shuffledOptions[index];
    });
  } else {
    endGame();
  }
}

// Deselect options after button submit
function deselectAllAnswerOptions() {
  document.querySelectorAll('.answer-option.selected').forEach((selectedOption) => {
    selectedOption.classList.remove('selected');
  });
}

// Function to shuffle an array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const startGame = async function () {
  document.querySelector(".game-over").style.display = "none";
  scrollToQuestionCard();
  startGamePopup.classList.add('hidden');

  document.querySelector(".start-game").classList.add("hidden");
  document.querySelector(".content").classList.remove("hidden");

  try {
    const response = await fetch("qanda.json");
    const data = await response.json();
    questions = data;
  } catch (error) {
    console.error("Error fetching questions and answers:", error);
    return;
  }

  startNewGame();
  loadNextQuestion();
}

window.startGameGlobal = startGame;

// Function to start a new game
function startNewGame() {
  correctAnswers = 0;
  currentQuestionIndex = 0;
  const questionPool = [...questions];
  shuffle(questionPool);

  shuffledQuestions = questionPool.slice(0, 10);

  // Show your score paragraph
  yourScore.classList.remove("hidden");

  // Reset the text of the action button to "Next Question"
  const actionButton = document.getElementById("submit-answer")
  actionButton.innerText = "Next Question"
  actionButton.style.backgroundColor = "#ff69b4"


  // Reset the score to 0
  score = 0;
  updateScore();
}

// Checks if user is on mobile
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function scrollToQuestionCard() {
  if (isMobileDevice()) {
    const questionCard = document.getElementById("question-card");
    if (questionCard) {
      questionCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function updateScore() {
  const scoreElement = document.getElementById("current-score"); // Replace ".score-display" with the appropriate selector for your score element
  scoreElement.textContent = `${score}`;
}

function checkAnswerAndUpdateScore() {
  const selectedOption = document.querySelector(".answer-option.selected");
  if (selectedOption) {
    const answer = selectedOption.dataset.option;
    const question = shuffledQuestions[currentQuestionIndex - 1];

    // Calculate time taken to answer the question
    const endTime = new Date();
    const timeToAnswer = (15.00 - countdown).toFixed(2);
    timeToAnswerList.push(parseFloat(timeToAnswer));

    // Log the time taken and the updated list
    console.log(`Time taken for question ${currentQuestionIndex}: ${timeToAnswer}`);
    console.log('Updated timeToAnswerList:', timeToAnswerList);

    // Check if the answer is correct
    if (answer === question.correct_answer) {

      // Calculate the score for the current question
      const timeScore = 30 * (countdown);
      const questionScore = timeScore * question.difficulty_multiplier;

      // Add the question score to the total score
      score += questionScore;

      // Increment the correctAnswers variable
      correctAnswers++;

      // Return true if the answer is correct
      return true;
    }
  }

  // Return false if the answer is incorrect or not selected
  return false;
}

// Function to end the game and display the final score
function endGame() {
  clearInterval(countdownInterval);

  const gameOverDiv = document.querySelector(".game-over");
  gameOverDiv.style.display = "block";

  const scoreDisplay = document.querySelector("#score");
  scoreDisplay.textContent = `${Math.floor(score)}`;

  const content = document.querySelector(".content");
  content.classList.add("game-over-mode");

  const scoreWrapper = document.querySelector(".score-wrapper");
  scoreWrapper.classList.add("hidden");

  // const averageTime = calculateAverageTime();
  console.log(timeToAnswerList);
  const name = nameInput.value;

  saveScore(name, score); // Pass the name string instead of the name input element
}

// Function to load the next question from the shuffled list of questions
function loadNextQuestion(answerIsCorrect) {
  if (currentQuestionIndex < shuffledQuestions.length) {
    if (currentQuestionIndex > 0) {
      const previousQuestionIndex = currentQuestionIndex - 1;
      const selectedOption = document.querySelector(".answer-option.selected");
      
      // Store the score before checking the answer
      const previousScore = score;

      // Reset startTime for the next question
      startTime = new Date();

      // Check the answer and update the score accordingly
      checkAnswerAndUpdateScore(selectedOption, shuffledQuestions[previousQuestionIndex]);

      // Compare the previous score to the current score to determine if the answer was correct
      if (score > previousScore) {
        // Correct answer, flash the screen green
        flashScreen("green");
      } else {
        // Incorrect answer, flash the screen red
        flashScreen("red");
      }
    }

    deselectAllAnswerOptions(); // Deselect the previously selected answer option
    renderQuestion(shuffledQuestions[currentQuestionIndex]);
    submitAnswerBtn.setAttribute('disabled', ''); // Disable the submit button until a new answer is selected

    // Check if the current question is the final question
    if (currentQuestionIndex === 9) {
      submitAnswerBtn.textContent = 'Finish Quiz';
      submitAnswerBtn.style.backgroundColor = '#800080';
    }

    // Update the score display
    updateScoreDisplay();

    currentQuestionIndex++;
    startCountdown();
  } else {
    // End the game and display the final score
    endGame();
  }
}

function flashScreen(color) {
  const bodyElement = document.querySelector("body");
  bodyElement.style.backgroundColor = color;

  setTimeout(() => {
    bodyElement.style.backgroundColor = "#222";
  }, 150)
}

// Update score after every question
function updateScoreDisplay() {
  const scoreElement = document.getElementById('current-score');
  scoreElement.textContent = Math.round(score);
}

// Initiate countdown variables
let countdown;
let countdownInterval;

// Countdown Function 
function startCountdown() {
  clearInterval(countdownInterval); // Clear any existing countdown interval
  countdown = 15.0; // Reset the countdown to 10 seconds
  const timerElement = document.getElementById("timer");

  countdownInterval = setInterval(() => {
    countdown -= 0.1; // Decrease the countdown by 0.1 seconds
    timerElement.textContent = countdown.toFixed(1); // Update the displayed countdown

    // Update the color of the timer based on the time remaining
    if (countdown <= 1.0) {
      timerElement.style.color = "#ff0000";
    } else if (countdown <= 2.0) {
      timerElement.style.color = "#ff7f50";
    } else if (countdown <= 4.0) {
      timerElement.style.color = "#ffff00";
    } else {
      timerElement.style.color = "#7df9ff";
    }

    // Check if the countdown has reached 0
    if (countdown <= 0) {
      clearInterval(countdownInterval); // Stop the countdown interval
      timerElement.textContent = "0.0"; // Set the displayed countdown to 0
      // Mark the question as incorrect and load the next question
      loadNextQuestion();
    }
  }, 100); // Update the countdown every 100ms (0.1 seconds)
} 

// Show the start-game popup on page load
startGamePopup.classList.remove('hidden');

// Validate the name input and enable/disable the start-game button
nameInput.addEventListener('input', () => {
  if (nameInput) {
    startGameBtn.removeAttribute('disabled');
  } else {
    startGameBtn.setAttribute('disabled', '');
  }
});

document.addEventListener("click", (event) => {
  if (event.target.dataset.action === "start-game") {
    startGame();
  }
});

async function saveScore(userName, score) {
  const q = query(
    collection(db, "leaderboard"),
    where("name", "==", userName)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // No matching name found, add a new entry
    await addDoc(collection(db, "leaderboard"), {
      name: userName,
      score: Math.floor(score),
      correct_answers: correctAnswers
    });
  } else {
    // Name found, check if the new score is higher
    querySnapshot.forEach(async (doc) => {
      if (doc.data().score < score) {
        // Update the score with the new higher score
        await updateDoc(docRef(db, "leaderboard", doc.id), {
          score: Math.floor(score),
          correct_answers: correctAnswers
        });
      }
    });
  }
  displayLeaderboard(); // Refresh the leaderboard
}

// Add an event listener for the start game button
startGameBtn.addEventListener("click", startGame);

// Display Leaderboard

async function displayLeaderboard() {
  const leaderboardContent = document.getElementById("leaderboard-content");
  
  leaderboardContent.innerHTML = ""; // Clear the existing content

  const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(5));
  const querySnapshot = await getDocs(q);
  
  let rank = 1;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");
    const username = data.name;
    row.innerHTML = `
      <td>${rank}</td>
      <td>${username}</td>
      <td>${data.score}</td>
    `;
    leaderboardContent.appendChild(row);
    rank++;
  });
}

document.getElementById("try-again").addEventListener("click", () => {
  // Start a new game with the same name
  startGame();
});
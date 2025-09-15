/**
 * Advanced Spotify Audio Features Analysis
 * Mirrors the sophisticated audio analysis from code.js
 */

export interface AdvancedAudioFeatures {
  // Core audio features
  energy: number;
  valence: number;
  tempo: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  loudness: number;
  key: number;
  mode: number;
  timeSignature: number;
  duration: number;

  // Derived metrics
  mood: string;
  energyLevel: string;
  tempoCategory: string;
  genre: string;
  listeningPattern: string;
  focusScore: number;
  relaxationScore: number;
  motivationScore: number;
  creativityScore: number;
}

export interface AudioAnalysisInsights {
  overallMood: string;
  energyProfile: string;
  listeningHabits: string;
  focusPattern: string;
  stressIndicators: string[];
  wellnessCorrelations: string[];
  recommendations: string[];
  audioSummary: string;
}

export interface TrackAnalysis {
  id: string;
  name: string;
  artists: string[];
  features: AdvancedAudioFeatures;
  playTime: string;
  context: string;
}

/**
 * Analyze advanced audio features from Spotify data
 * Mirrors the comprehensive analysis from code.js
 */
export function analyzeAdvancedAudioFeatures(
  tracks: any[],
  audioFeatures: any[]
): AdvancedAudioFeatures {
  if (!audioFeatures || audioFeatures.length === 0) {
    return getDefaultAudioFeatures();
  }

  const validFeatures = audioFeatures.filter((f) => f !== null);
  if (validFeatures.length === 0) {
    return getDefaultAudioFeatures();
  }

  // Calculate averages for all audio features
  const avgEnergy = calculateAverage(validFeatures, "energy");
  const avgValence = calculateAverage(validFeatures, "valence");
  const avgTempo = calculateAverage(validFeatures, "tempo");
  const avgDanceability = calculateAverage(validFeatures, "danceability");
  const avgAcousticness = calculateAverage(validFeatures, "acousticness");
  const avgInstrumentalness = calculateAverage(
    validFeatures,
    "instrumentalness"
  );
  const avgLiveness = calculateAverage(validFeatures, "liveness");
  const avgSpeechiness = calculateAverage(validFeatures, "speechiness");
  const avgLoudness = calculateAverage(validFeatures, "loudness");
  const avgKey = calculateAverage(validFeatures, "key");
  const avgMode = calculateAverage(validFeatures, "mode");
  const avgTimeSignature = calculateAverage(validFeatures, "time_signature");
  const avgDuration = calculateAverage(validFeatures, "duration_ms") / 1000;

  // Determine mood based on valence and energy
  const mood = determineMood(avgValence, avgEnergy);
  const energyLevel = determineEnergyLevel(avgEnergy);
  const tempoCategory = determineTempoCategory(avgTempo);
  const genre = determineGenre(
    avgAcousticness,
    avgInstrumentalness,
    avgDanceability,
    avgEnergy
  );
  const listeningPattern = determineListeningPattern(tracks, avgDuration);

  // Calculate derived scores
  const focusScore = calculateFocusScore(
    avgInstrumentalness,
    avgSpeechiness,
    avgLiveness
  );
  const relaxationScore = calculateRelaxationScore(
    avgValence,
    avgEnergy,
    avgTempo
  );
  const motivationScore = calculateMotivationScore(
    avgEnergy,
    avgValence,
    avgTempo
  );
  const creativityScore = calculateCreativityScore(
    avgInstrumentalness,
    avgAcousticness,
    avgValence
  );

  return {
    energy: avgEnergy,
    valence: avgValence,
    tempo: avgTempo,
    danceability: avgDanceability,
    acousticness: avgAcousticness,
    instrumentalness: avgInstrumentalness,
    liveness: avgLiveness,
    speechiness: avgSpeechiness,
    loudness: avgLoudness,
    key: avgKey,
    mode: avgMode,
    timeSignature: avgTimeSignature,
    duration: avgDuration,
    mood,
    energyLevel,
    tempoCategory,
    genre,
    listeningPattern,
    focusScore,
    relaxationScore,
    motivationScore,
    creativityScore,
  };
}

/**
 * Generate comprehensive audio analysis insights
 */
export function generateAudioAnalysisInsights(
  audioFeatures: AdvancedAudioFeatures,
  tracks: any[],
  context: any = {}
): AudioAnalysisInsights {
  const insights: AudioAnalysisInsights = {
    overallMood: generateMoodInsight(audioFeatures),
    energyProfile: generateEnergyProfile(audioFeatures),
    listeningHabits: generateListeningHabitsInsight(audioFeatures, tracks),
    focusPattern: generateFocusPatternInsight(audioFeatures),
    stressIndicators: generateStressIndicators(audioFeatures),
    wellnessCorrelations: generateWellnessCorrelations(audioFeatures, context),
    recommendations: generateAudioRecommendations(audioFeatures, context),
    audioSummary: generateAudioSummary(audioFeatures, tracks),
  };

  return insights;
}

/**
 * Analyze individual tracks for detailed insights
 */
export function analyzeIndividualTracks(
  tracks: any[],
  audioFeatures: any[] | null
): TrackAnalysis[] {
  return tracks.map((track, index) => {
    const features = audioFeatures?.[index] || {};
    const trackFeatures = analyzeAdvancedAudioFeatures([track], [features]);

    return {
      id: track.id,
      name: track.name,
      artists: track.artists?.map((a: any) => a.name) || [],
      features: trackFeatures,
      playTime: track.played_at || new Date().toISOString(),
      context: determineTrackContext(trackFeatures),
    };
  });
}

// Helper functions

function calculateAverage(features: any[], property: string): number {
  const values = features
    .map((f) => f[property])
    .filter((v) => v !== null && v !== undefined);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function determineMood(valence: number, energy: number): string {
  if (valence > 0.7 && energy > 0.7) return "Euphoric";
  if (valence > 0.6 && energy > 0.5) return "Happy";
  if (valence > 0.5 && energy < 0.4) return "Calm";
  if (valence < 0.4 && energy > 0.6) return "Intense";
  if (valence < 0.3 && energy < 0.4) return "Melancholic";
  if (valence < 0.2 && energy < 0.2) return "Depressed";
  return "Neutral";
}

function determineEnergyLevel(energy: number): string {
  if (energy > 0.8) return "Very High";
  if (energy > 0.6) return "High";
  if (energy > 0.4) return "Medium";
  if (energy > 0.2) return "Low";
  return "Very Low";
}

function determineTempoCategory(tempo: number): string {
  if (tempo < 60) return "Very Slow";
  if (tempo < 80) return "Slow";
  if (tempo < 120) return "Moderate";
  if (tempo < 140) return "Fast";
  if (tempo < 180) return "Very Fast";
  return "Extremely Fast";
}

function determineGenre(
  acousticness: number,
  instrumentalness: number,
  danceability: number,
  energy: number
): string {
  if (acousticness > 0.7) return "Acoustic";
  if (instrumentalness > 0.7) return "Instrumental";
  if (danceability > 0.7 && energy > 0.6) return "Electronic/Dance";
  if (energy > 0.8) return "Rock/Metal";
  if (acousticness > 0.4 && energy < 0.4) return "Folk/Indie";
  return "Pop/Contemporary";
}

function determineListeningPattern(tracks: any[], avgDuration: number): string {
  const totalDuration = tracks.length * avgDuration;
  const hours = totalDuration / 3600;

  if (hours > 4) return "Heavy Listener";
  if (hours > 2) return "Moderate Listener";
  if (hours > 1) return "Light Listener";
  return "Minimal Listener";
}

function calculateFocusScore(
  instrumentalness: number,
  speechiness: number,
  liveness: number
): number {
  // Higher instrumentalness and lower speechiness/liveness = better focus
  const focus =
    instrumentalness * 0.5 + (1 - speechiness) * 0.3 + (1 - liveness) * 0.2;
  return Math.round(focus * 100);
}

function calculateRelaxationScore(
  valence: number,
  energy: number,
  tempo: number
): number {
  // Higher valence, lower energy, moderate tempo = more relaxing
  const relaxation =
    valence * 0.4 + (1 - energy) * 0.4 + (tempo < 120 ? 0.2 : 0);
  return Math.round(Math.min(relaxation * 100, 100));
}

function calculateMotivationScore(
  energy: number,
  valence: number,
  tempo: number
): number {
  // Higher energy, valence, and tempo = more motivating
  const motivation =
    energy * 0.4 + valence * 0.3 + Math.min(tempo / 200, 1) * 0.3;
  return Math.round(motivation * 100);
}

function calculateCreativityScore(
  instrumentalness: number,
  acousticness: number,
  valence: number
): number {
  // Higher instrumentalness and acousticness with moderate valence = more creative
  const creativity =
    instrumentalness * 0.4 + acousticness * 0.3 + Math.abs(valence - 0.5) * 0.3;
  return Math.round(creativity * 100);
}

function determineTrackContext(features: AdvancedAudioFeatures): string {
  if (features.focusScore > 80) return "Focus/Work";
  if (features.relaxationScore > 80) return "Relaxation";
  if (features.motivationScore > 80) return "Motivation/Exercise";
  if (features.creativityScore > 80) return "Creative Work";
  return "General Listening";
}

function generateMoodInsight(features: AdvancedAudioFeatures): string {
  const { mood, valence, energy } = features;

  if (mood === "Euphoric") {
    return "Your music choices reflect high energy and positivity - perfect for motivation and celebration.";
  } else if (mood === "Happy") {
    return "Your listening shows a balanced, upbeat mood with good energy levels.";
  } else if (mood === "Calm") {
    return "Your music selection suggests a peaceful, relaxed state of mind.";
  } else if (mood === "Intense") {
    return "Your music choices indicate high energy but lower positivity - consider more uplifting tracks.";
  } else if (mood === "Melancholic") {
    return "Your music reflects a more somber mood - consider adding some uplifting tracks for balance.";
  } else if (mood === "Depressed") {
    return "Your music choices suggest you might be going through a difficult time - consider reaching out for support.";
  }

  return "Your music listening shows a neutral, balanced emotional state.";
}

function generateEnergyProfile(features: AdvancedAudioFeatures): string {
  const { energyLevel, tempoCategory, energy } = features;

  if (energyLevel === "Very High") {
    return `High-energy listening with ${tempoCategory.toLowerCase()} tempo - great for workouts and high-intensity activities.`;
  } else if (energyLevel === "High") {
    return `Energetic music selection with ${tempoCategory.toLowerCase()} tempo - good for active tasks and motivation.`;
  } else if (energyLevel === "Medium") {
    return `Moderate energy levels with ${tempoCategory.toLowerCase()} tempo - balanced for various activities.`;
  } else if (energyLevel === "Low") {
    return `Low-energy music with ${tempoCategory.toLowerCase()} tempo - suitable for relaxation and calm activities.`;
  }

  return `Very low energy music - ideal for deep relaxation and meditation.`;
}

function generateListeningHabitsInsight(
  features: AdvancedAudioFeatures,
  tracks: any[]
): string {
  const { listeningPattern, genre, duration } = features;
  const totalHours = (tracks.length * duration) / 3600;

  return `You're a ${listeningPattern.toLowerCase()} with ${totalHours.toFixed(
    1
  )} hours of ${genre.toLowerCase()} music, averaging ${Math.round(
    duration / 60
  )} minutes per track.`;
}

function generateFocusPatternInsight(features: AdvancedAudioFeatures): string {
  const { focusScore, instrumentalness, speechiness } = features;

  if (focusScore > 80) {
    return "Excellent focus music - high instrumental content with minimal distractions.";
  } else if (focusScore > 60) {
    return "Good focus music - mostly instrumental with some vocal content.";
  } else if (focusScore > 40) {
    return "Moderate focus music - mix of instrumental and vocal content.";
  }

  return "Low focus music - high vocal content may be distracting for deep work.";
}

function generateStressIndicators(features: AdvancedAudioFeatures): string[] {
  const indicators: string[] = [];
  const { energy, valence, tempo, loudness } = features;

  if (energy > 0.8 && valence < 0.3) {
    indicators.push(
      "High energy with low positivity - potential stress indicator"
    );
  }
  if (tempo > 160) {
    indicators.push("Very fast tempo - may indicate restlessness or anxiety");
  }
  if (loudness > -5) {
    indicators.push(
      "Very loud music - may indicate need for stimulation or masking stress"
    );
  }
  if (energy > 0.7 && tempo > 140 && valence < 0.4) {
    indicators.push(
      "Intense, fast, low-positivity music - classic stress response pattern"
    );
  }

  return indicators;
}

function generateWellnessCorrelations(
  features: AdvancedAudioFeatures,
  context: any
): string[] {
  const correlations: string[] = [];
  const { mood, energyLevel, relaxationScore, motivationScore } = features;

  if (mood === "Calm" && relaxationScore > 70) {
    correlations.push("Music choices support relaxation and stress reduction");
  }
  if (mood === "Happy" && motivationScore > 70) {
    correlations.push(
      "Upbeat music likely supporting positive mood and motivation"
    );
  }
  if (energyLevel === "High" && context.activityLevel === "high") {
    correlations.push("High-energy music aligns with active lifestyle");
  }
  if (relaxationScore > 80 && context.stressLevel === "high") {
    correlations.push("Calming music may be helping manage stress");
  }

  return correlations;
}

function generateAudioRecommendations(
  features: AdvancedAudioFeatures,
  context: any
): string[] {
  const recommendations: string[] = [];
  const { focusScore, relaxationScore, mood, energyLevel } = features;

  if (focusScore < 60 && context.workFocus === "low") {
    recommendations.push(
      "Try more instrumental music for better focus during work"
    );
  }
  if (relaxationScore < 60 && context.stressLevel === "high") {
    recommendations.push(
      "Consider adding more calming, slower-tempo music for stress relief"
    );
  }
  if (mood === "Melancholic" || mood === "Depressed") {
    recommendations.push("Add some uplifting, positive music to improve mood");
  }
  if (energyLevel === "Very Low" && context.activityLevel === "low") {
    recommendations.push(
      "Try some energizing music to boost motivation and activity"
    );
  }

  return recommendations;
}

function generateAudioSummary(
  features: AdvancedAudioFeatures,
  tracks: any[]
): string {
  const {
    mood,
    energyLevel,
    genre,
    listeningPattern,
    focusScore,
    relaxationScore,
  } = features;
  const totalHours = (tracks.length * features.duration) / 3600;

  return (
    `Your ${listeningPattern.toLowerCase()} session featured ${mood.toLowerCase()} ${genre.toLowerCase()} music with ${energyLevel.toLowerCase()} energy. ` +
    `Focus score: ${focusScore}/100, Relaxation score: ${relaxationScore}/100. ` +
    `Total listening time: ${totalHours.toFixed(1)} hours across ${
      tracks.length
    } tracks.`
  );
}

function getDefaultAudioFeatures(): AdvancedAudioFeatures {
  return {
    energy: 0,
    valence: 0,
    tempo: 0,
    danceability: 0,
    acousticness: 0,
    instrumentalness: 0,
    liveness: 0,
    speechiness: 0,
    loudness: 0,
    key: 0,
    mode: 0,
    timeSignature: 0,
    duration: 0,
    mood: "Unknown",
    energyLevel: "Unknown",
    tempoCategory: "Unknown",
    genre: "Unknown",
    listeningPattern: "Unknown",
    focusScore: 0,
    relaxationScore: 0,
    motivationScore: 0,
    creativityScore: 0,
  };
}

"""
Clustering Service
Classifies students into learning behavior clusters
"""

import os
import pickle
import logging
from typing import List, Dict, Any
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

class ClusteringService:
    """Service for clustering students by learning behavior"""
    
    # Cluster definitions
    CLUSTERS = {
        'high_performer': {
            'name': 'High Performer',
            'description': 'Consistently high scores with good engagement',
            'characteristics': ['high_scores', 'consistent', 'engaged']
        },
        'consistent_learner': {
            'name': 'Consistent Learner',
            'description': 'Steady progress with moderate scores',
            'characteristics': ['steady_progress', 'reliable', 'moderate_scores']
        },
        'irregular_learner': {
            'name': 'Irregular Learner',
            'description': 'Inconsistent engagement and performance',
            'characteristics': ['inconsistent', 'variable_scores', 'needs_structure']
        },
        'at_risk': {
            'name': 'At Risk',
            'description': 'Low engagement and poor performance',
            'characteristics': ['low_engagement', 'struggling', 'needs_support']
        },
        'new': {
            'name': 'New Student',
            'description': 'Recently joined, insufficient data',
            'characteristics': ['new', 'insufficient_data']
        }
    }
    
    def __init__(self, model_path: str = "data/models"):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'avg_score', 'quiz_frequency', 'activity_frequency',
            'score_variance', 'completion_rate', 'streak_days'
        ]
        
        os.makedirs(model_path, exist_ok=True)
    
    def load_model(self):
        """Load trained model from disk"""
        model_file = os.path.join(self.model_path, "clustering_model.pkl")
        scaler_file = os.path.join(self.model_path, "clustering_scaler.pkl")
        
        if os.path.exists(model_file):
            with open(model_file, 'rb') as f:
                self.model = pickle.load(f)
            logger.info("Clustering model loaded successfully")
        
        if os.path.exists(scaler_file):
            with open(scaler_file, 'rb') as f:
                self.scaler = pickle.load(f)
    
    def save_model(self):
        """Save trained model to disk"""
        if self.model is None:
            return
        
        model_file = os.path.join(self.model_path, "clustering_model.pkl")
        scaler_file = os.path.join(self.model_path, "clustering_scaler.pkl")
        
        with open(model_file, 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(scaler_file, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        logger.info("Clustering model saved successfully")
    
    def extract_features(
        self,
        performance_metrics: Dict[str, Any],
        quiz_history: List[Dict[str, Any]],
        activity_pattern: List[Dict[str, Any]]
    ) -> np.ndarray:
        """Extract clustering features"""
        
        scores = [q['score'] for q in quiz_history]
        
        # Average score
        avg_score = np.mean(scores) if scores else 0
        
        # Score variance
        score_variance = np.var(scores) if len(scores) > 1 else 0
        
        # Quiz frequency (quizzes per week)
        if len(quiz_history) >= 2:
            first_date = datetime.fromisoformat(str(quiz_history[-1]['completedAt']).replace('Z', '+00:00'))
            last_date = datetime.fromisoformat(str(quiz_history[0]['completedAt']).replace('Z', '+00:00'))
            days_diff = max(1, (last_date - first_date).days)
            quiz_frequency = (len(quiz_history) / days_diff) * 7
        else:
            quiz_frequency = 0
        
        # Activity frequency
        activity_frequency = len(activity_pattern) / 30 if activity_pattern else 0
        
        # Completion rate
        completion_rate = performance_metrics.get('completionRate', 0) / 100
        
        # Streak days
        streak_days = performance_metrics.get('streakDays', 0)
        
        features = np.array([
            avg_score,
            quiz_frequency,
            activity_frequency,
            score_variance,
            completion_rate,
            streak_days
        ])
        
        return features
    
    def classify_student(
        self,
        performance_metrics: Dict[str, Any],
        quiz_history: List[Dict[str, Any]],
        activity_pattern: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Classify student into a learning cluster"""
        
        # Check if new student
        if len(quiz_history) < 3:
            return {
                "cluster": "new",
                "confidence": 0.8,
                "characteristics": self.CLUSTERS['new']['characteristics']
            }
        
        # Extract features
        features = self.extract_features(performance_metrics, quiz_history, activity_pattern)
        
        # Calculate cluster scores based on rules
        scores = [q['score'] for q in quiz_history]
        avg_score = np.mean(scores)
        score_variance = np.var(scores) if len(scores) > 1 else 0
        completion_rate = performance_metrics.get('completionRate', 0)
        streak_days = performance_metrics.get('streakDays', 0)
        
        # Classification rules
        if avg_score >= 80 and completion_rate >= 70 and streak_days >= 7:
            cluster = "high_performer"
            confidence = 0.85
        elif avg_score >= 60 and completion_rate >= 50:
            cluster = "consistent_learner"
            confidence = 0.75
        elif completion_rate < 30 or streak_days < 2:
            cluster = "at_risk"
            confidence = 0.8
        elif score_variance > 400:  # High variance in scores
            cluster = "irregular_learner"
            confidence = 0.7
        else:
            cluster = "consistent_learner"
            confidence = 0.6
        
        return {
            "cluster": cluster,
            "confidence": round(confidence, 2),
            "characteristics": self.CLUSTERS[cluster]['characteristics']
        }
    
    def get_cluster_insights(self, cluster: str) -> Dict[str, Any]:
        """Get insights and recommendations for a cluster"""
        if cluster not in self.CLUSTERS:
            return {"error": "Unknown cluster"}
        
        cluster_info = self.CLUSTERS[cluster]
        
        # Cluster-specific recommendations
        recommendations = {
            'high_performer': [
                'Provide advanced challenges',
                'Offer peer tutoring opportunities',
                'Consider acceleration options'
            ],
            'consistent_learner': [
                'Maintain current pace',
                'Provide targeted practice',
                'Encourage exploration of new topics'
            ],
            'irregular_learner': [
                'Establish regular study schedule',
                'Provide structured learning paths',
                'Send regular reminders'
            ],
            'at_risk': [
                'Schedule one-on-one support',
                'Identify and address learning gaps',
                'Increase engagement through interactive content'
            ],
            'new': [
                'Complete onboarding process',
                'Assess learning style',
                'Set initial learning goals'
            ]
        }
        
        return {
            "cluster": cluster,
            "name": cluster_info['name'],
            "description": cluster_info['description'],
            "characteristics": cluster_info['characteristics'],
            "recommendations": recommendations.get(cluster, [])
        }
    
    def train_model(self, training_data: List[Dict[str, Any]] = None):
        """Train the clustering model"""
        logger.info("Training clustering model...")
        
        # Use K-means clustering
        self.model = KMeans(n_clusters=4, random_state=42, n_init=10)
        
        # Generate synthetic training data if none provided
        if training_data is None:
            training_data = self._generate_synthetic_training_data()
        
        # Prepare features
        X = []
        for data in training_data:
            features = self.extract_features(
                data['performance_metrics'],
                data['quiz_history'],
                data.get('activity_pattern', [])
            )
            X.append(features)
        
        X = np.array(X)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled)
        
        # Save model
        self.save_model()
        
        logger.info("Clustering model trained successfully")
    
    def _generate_synthetic_training_data(self, n_samples: int = 500) -> List[Dict[str, Any]]:
        """Generate synthetic training data"""
        np.random.seed(42)
        training_data = []
        
        for _ in range(n_samples):
            # Random cluster type
            cluster_type = np.random.choice(['high', 'consistent', 'irregular', 'at_risk'])
            
            if cluster_type == 'high':
                base_score = np.random.uniform(80, 100)
                variance = np.random.uniform(10, 50)
                completion = np.random.uniform(80, 100)
                streak = np.random.uniform(7, 30)
            elif cluster_type == 'consistent':
                base_score = np.random.uniform(60, 80)
                variance = np.random.uniform(20, 80)
                completion = np.random.uniform(50, 80)
                streak = np.random.uniform(3, 14)
            elif cluster_type == 'irregular':
                base_score = np.random.uniform(50, 80)
                variance = np.random.uniform(100, 300)
                completion = np.random.uniform(30, 60)
                streak = np.random.uniform(0, 5)
            else:  # at_risk
                base_score = np.random.uniform(20, 60)
                variance = np.random.uniform(50, 200)
                completion = np.random.uniform(0, 30)
                streak = np.random.uniform(0, 2)
            
            n_quizzes = np.random.randint(5, 20)
            quiz_history = []
            
            for i in range(n_quizzes):
                score = base_score + np.random.normal(0, np.sqrt(variance))
                score = max(0, min(100, score))
                quiz_history.append({
                    'score': score,
                    'completedAt': datetime.now()
                })
            
            training_data.append({
                'performance_metrics': {
                    'completionRate': completion,
                    'streakDays': streak
                },
                'quiz_history': quiz_history,
                'activity_pattern': []
            })
        
        return training_data
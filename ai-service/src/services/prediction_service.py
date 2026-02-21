"""
Prediction Service
Handles performance prediction using various ML techniques
"""

import os
import pickle
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

logger = logging.getLogger(__name__)

class PredictionService:
    """Service for predicting student performance"""
    
    def __init__(self, model_path: str = "data/models"):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'avg_score', 'score_trend', 'quiz_count', 'days_since_last',
            'score_variance', 'recent_avg', 'completion_rate'
        ]
        
        # Ensure model directory exists
        os.makedirs(model_path, exist_ok=True)
    
    def load_model(self):
        """Load trained model from disk"""
        model_file = os.path.join(self.model_path, "performance_model.pkl")
        scaler_file = os.path.join(self.model_path, "performance_scaler.pkl")
        
        if os.path.exists(model_file):
            with open(model_file, 'rb') as f:
                self.model = pickle.load(f)
            logger.info("Performance model loaded successfully")
        
        if os.path.exists(scaler_file):
            with open(scaler_file, 'rb') as f:
                self.scaler = pickle.load(f)
    
    def save_model(self):
        """Save trained model to disk"""
        if self.model is None:
            return
        
        model_file = os.path.join(self.model_path, "performance_model.pkl")
        scaler_file = os.path.join(self.model_path, "performance_scaler.pkl")
        
        with open(model_file, 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(scaler_file, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        logger.info("Performance model saved successfully")
    
    def extract_features(self, quiz_history: List[Dict[str, Any]]) -> np.ndarray:
        """Extract features from quiz history"""
        if not quiz_history:
            return np.zeros(len(self.feature_columns))
        
        scores = [q['score'] for q in quiz_history]
        
        # Basic statistics
        avg_score = np.mean(scores)
        score_variance = np.var(scores) if len(scores) > 1 else 0
        quiz_count = len(scores)
        
        # Trend analysis
        if len(scores) >= 3:
            # Simple linear regression for trend
            x = np.arange(len(scores)).reshape(-1, 1)
            y = np.array(scores)
            trend_model = LinearRegression()
            trend_model.fit(x, y)
            score_trend = trend_model.coef_[0]
        else:
            score_trend = 0
        
        # Recent performance (last 3 quizzes)
        recent_scores = scores[:3] if len(scores) >= 3 else scores
        recent_avg = np.mean(recent_scores) if recent_scores else 0
        
        # Days since last quiz
        if quiz_history:
            last_date = datetime.fromisoformat(str(quiz_history[0]['completedAt']).replace('Z', '+00:00'))
            days_since_last = (datetime.now() - last_date).days
        else:
            days_since_last = 30
        
        # Completion rate (assuming all started were completed for now)
        completion_rate = 1.0
        
        features = np.array([
            avg_score,
            score_trend,
            quiz_count,
            days_since_last,
            score_variance,
            recent_avg,
            completion_rate
        ])
        
        return features
    
    def predict_performance(
        self,
        quiz_history: List[Dict[str, Any]],
        current_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Predict next quiz performance"""
        
        # Extract features
        features = self.extract_features(quiz_history)
        
        # If no history, use current metrics
        if len(quiz_history) == 0:
            predicted_score = current_metrics.get('averageQuizScore', 70)
            confidence = 0.3
            trend = 'new'
            factors = ['no_history']
        else:
            scores = [q['score'] for q in quiz_history]
            
            # Calculate trend
            if len(scores) >= 3:
                recent_avg = np.mean(scores[:3])
                older_avg = np.mean(scores[3:6]) if len(scores) >= 6 else np.mean(scores[-3:])
                
                if recent_avg > older_avg + 5:
                    trend = 'improving'
                elif recent_avg < older_avg - 5:
                    trend = 'declining'
                else:
                    trend = 'stable'
            else:
                trend = 'insufficient_data'
            
            # Predict using weighted average and trend
            avg_score = np.mean(scores)
            recent_avg = np.mean(scores[:min(3, len(scores))])
            
            # Weight recent performance more heavily
            predicted_score = (recent_avg * 0.6) + (avg_score * 0.4)
            
            # Adjust based on trend
            if trend == 'improving':
                predicted_score = min(100, predicted_score + 5)
            elif trend == 'declining':
                predicted_score = max(0, predicted_score - 5)
            
            # Confidence based on data quantity
            confidence = min(0.9, 0.3 + (len(scores) * 0.05))
            
            # Identify factors
            factors = []
            if len(scores) >= 5:
                factors.append('sufficient_history')
            if recent_avg > avg_score:
                factors.append('recent_improvement')
            if np.var(scores) < 100:
                factors.append('consistent_performance')
        
        return {
            "predicted_score": round(predicted_score, 1),
            "confidence": round(confidence, 2),
            "trend": trend,
            "factors": factors
        }
    
    def identify_weak_topics(self, quiz_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify topics where student is struggling"""
        weak_topics = []
        
        # Group by subject
        subject_scores = {}
        for attempt in quiz_history:
            subject = attempt.get('subject')
            if subject:
                if subject not in subject_scores:
                    subject_scores[subject] = []
                subject_scores[subject].append(attempt['score'])
        
        # Find subjects with low average scores
        for subject, scores in subject_scores.items():
            avg_score = np.mean(scores)
            if avg_score < 60:
                weak_topics.append({
                    "subject": subject,
                    "averageScore": round(avg_score, 1),
                    "attempts": len(scores),
                    "priority": "high" if avg_score < 50 else "medium"
                })
        
        # Sort by priority and score
        weak_topics.sort(key=lambda x: (x['priority'] != 'high', x['averageScore']))
        
        return weak_topics[:5]  # Return top 5 weak topics
    
    def train_model(self, training_data: List[Dict[str, Any]] = None):
        """Train the prediction model"""
        logger.info("Training performance prediction model...")
        
        # For now, use a simple Gradient Boosting model
        # In production, this would use actual historical data
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=3,
            random_state=42
        )
        
        # Generate synthetic training data if none provided
        if training_data is None:
            training_data = self._generate_synthetic_training_data()
        
        # Prepare features and targets
        X = []
        y = []
        
        for data in training_data:
            features = self.extract_features(data['quiz_history'])
            X.append(features)
            y.append(data['target_score'])
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        
        # Save model
        self.save_model()
        
        logger.info("Performance prediction model trained successfully")
    
    def _generate_synthetic_training_data(self, n_samples: int = 1000) -> List[Dict[str, Any]]:
        """Generate synthetic training data for demonstration"""
        np.random.seed(42)
        training_data = []
        
        for _ in range(n_samples):
            n_quizzes = np.random.randint(1, 20)
            quiz_history = []
            
            # Generate quiz scores with some correlation
            base_score = np.random.uniform(40, 90)
            
            for i in range(n_quizzes):
                score = base_score + np.random.normal(0, 10)
                score = max(0, min(100, score))
                
                quiz_history.append({
                    'score': score,
                    'completedAt': datetime.now() - timedelta(days=i*2)
                })
            
            # Target is the next quiz score
            target = base_score + np.random.normal(0, 8)
            target = max(0, min(100, target))
            
            training_data.append({
                'quiz_history': quiz_history,
                'target_score': target
            })
        
        return training_data
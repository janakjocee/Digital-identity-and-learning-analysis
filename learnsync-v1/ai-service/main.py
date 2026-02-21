"""
LearnSync AI v1.0 - AI Microservice
Production-ready FastAPI service with ML model management

Features:
- Model persistence and versioning
- Scheduled retraining
- Feature engineering pipeline
- Performance evaluation metrics
- Risk scoring algorithm
- Model explainability (SHAP-style)
- Real-time prediction API
- Health monitoring

Author: IEEE Research Implementation
Version: 1.0.0
"""

import os
import sys
import json
import pickle
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, f1_score, classification_report
import joblib
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import redis.asyncio as redis

# ============================================
# CONFIGURATION
# ============================================
CONFIG = {
    "MODEL_PATH": os.getenv("MODEL_PATH", "/app/models"),
    "DATA_PATH": os.getenv("DATA_PATH", "/app/data"),
    "LOG_PATH": os.getenv("LOG_PATH", "/app/logs"),
    "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6379"),
    "BACKEND_URL": os.getenv("BACKEND_URL", "http://localhost:5000"),
    "RETRAIN_CRON": os.getenv("MODEL_RETRAIN_CRON", "0 2 * * 0"),  # Weekly at 2 AM Sunday
    "ENABLE_EXPLAINABILITY": os.getenv("ENABLE_MODEL_EXPLAINABILITY", "true").lower() == "true",
    "WORKERS": int(os.getenv("WORKERS", "4")),
    "LOG_LEVEL": os.getenv("LOG_LEVEL", "INFO")
}

# ============================================
# LOGGING SETUP
# ============================================
os.makedirs(CONFIG["LOG_PATH"], exist_ok=True)

logging.basicConfig(
    level=getattr(logging, CONFIG["LOG_LEVEL"]),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(f"{CONFIG['LOG_PATH']}/ai_service.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("learnsync-ai")

# ============================================
# PYDANTIC MODELS
# ============================================

class StudentData(BaseModel):
    student_id: str
    grade: int = Field(..., ge=8, le=12)
    quizzes_taken: int = Field(..., ge=0)
    average_score: float = Field(..., ge=0, le=100)
    total_time_spent: float = Field(..., ge=0)
    streak_days: int = Field(..., ge=0)
    completion_rate: float = Field(..., ge=0, le=100)
    login_frequency: float = Field(..., ge=0)
    subject_scores: Dict[str, float] = Field(default_factory=dict)

class PredictionRequest(BaseModel):
    student_data: StudentData

class PredictionResponse(BaseModel):
    predicted_score: float
    confidence: float
    risk_level: str
    factors: List[Dict[str, Any]]
    recommendations: List[str]
    model_version: str
    generated_at: str

class ClusterRequest(BaseModel):
    students: List[StudentData]

class ClusterResponse(BaseModel):
    clusters: Dict[str, List[str]]
    cluster_profiles: Dict[str, Dict[str, Any]]
    model_version: str
    generated_at: str

class RiskAssessmentRequest(BaseModel):
    student_data: StudentData

class RiskAssessmentResponse(BaseModel):
    risk_level: str
    risk_score: float
    risk_factors: List[str]
    dropout_probability: float
    intervention_urgency: str
    recommendations: List[str]
    model_version: str
    generated_at: str

class RecommendationRequest(BaseModel):
    student_id: str
    weak_topics: List[str]
    strong_topics: List[str]
    current_grade: int
    learning_style: Optional[str] = "mixed"

class RecommendationResponse(BaseModel):
    student_id: str
    recommendations: List[Dict[str, Any]]
    learning_path: List[Dict[str, Any]]
    practice_sets: List[Dict[str, Any]]
    study_schedule: Dict[str, Any]
    generated_at: str

class ModelMetrics(BaseModel):
    model_name: str
    version: str
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None
    last_trained: str
    training_samples: int
    is_active: bool

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    services: Dict[str, str]
    models_loaded: List[str]

# ============================================
# MODEL MANAGER
# ============================================

class ModelManager:
    """Manages ML model lifecycle: training, persistence, versioning"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.metrics = {}
        self.versions = {}
        self.model_path = CONFIG["MODEL_PATH"]
        os.makedirs(self.model_path, exist_ok=True)
        
    def get_model_path(self, model_name: str, version: str = "latest") -> str:
        """Get path for model file"""
        if version == "latest":
            return os.path.join(self.model_path, f"{model_name}_latest.pkl")
        return os.path.join(self.model_path, f"{model_name}_{version}.pkl")
    
    def save_model(self, model_name: str, model: Any, version: str = None):
        """Save model to disk with versioning"""
        version = version or datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save versioned model
        version_path = self.get_model_path(model_name, version)
        joblib.dump(model, version_path)
        
        # Save as latest
        latest_path = self.get_model_path(model_name, "latest")
        joblib.dump(model, latest_path)
        
        # Update version tracking
        self.versions[model_name] = version
        
        # Save version metadata
        metadata = {
            "version": version,
            "saved_at": datetime.now().isoformat(),
            "model_type": type(model).__name__
        }
        with open(f"{version_path}.meta", "w") as f:
            json.dump(metadata, f)
            
        logger.info(f"Model {model_name} saved (version: {version})")
        return version
    
    def load_model(self, model_name: str, version: str = "latest") -> Any:
        """Load model from disk"""
        try:
            model_path = self.get_model_path(model_name, version)
            if not os.path.exists(model_path):
                logger.warning(f"Model {model_name} not found at {model_path}")
                return None
            
            model = joblib.load(model_path)
            self.models[model_name] = model
            
            # Load version info
            meta_path = f"{model_path}.meta"
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    metadata = json.load(f)
                    self.versions[model_name] = metadata.get("version", "unknown")
            
            logger.info(f"Model {model_name} loaded (version: {self.versions.get(model_name, 'unknown')})")
            return model
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {e}")
            return None
    
    def save_scaler(self, name: str, scaler: Any):
        """Save feature scaler"""
        scaler_path = os.path.join(self.model_path, f"{name}_scaler.pkl")
        joblib.dump(scaler, scaler_path)
        self.scalers[name] = scaler
        
    def load_scaler(self, name: str) -> Any:
        """Load feature scaler"""
        scaler_path = os.path.join(self.model_path, f"{name}_scaler.pkl")
        if os.path.exists(scaler_path):
            self.scalers[name] = joblib.load(scaler_path)
            return self.scalers[name]
        return None
    
    def update_metrics(self, model_name: str, metrics: Dict[str, Any]):
        """Update model performance metrics"""
        self.metrics[model_name] = {
            **metrics,
            "updated_at": datetime.now().isoformat()
        }
        
        # Save metrics to file
        metrics_path = os.path.join(self.model_path, f"{model_name}_metrics.json")
        with open(metrics_path, "w") as f:
            json.dump(self.metrics[model_name], f, indent=2)
    
    def get_metrics(self, model_name: str) -> Dict[str, Any]:
        """Get model metrics"""
        if model_name in self.metrics:
            return self.metrics[model_name]
        
        # Try loading from file
        metrics_path = os.path.join(self.model_path, f"{model_name}_metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                return json.load(f)
        return {}
    
    def list_models(self) -> List[str]:
        """List all available models"""
        models = []
        for file in os.listdir(self.model_path):
            if file.endswith("_latest.pkl"):
                models.append(file.replace("_latest.pkl", ""))
        return models

# Global model manager
model_manager = ModelManager()

# ============================================
# FEATURE ENGINEERING
# ============================================

class FeatureEngineer:
    """Handles feature engineering for student data"""
    
    @staticmethod
    def extract_features(student_data: StudentData) -> np.ndarray:
        """Extract numerical features from student data"""
        features = [
            student_data.grade,
            student_data.quizzes_taken,
            student_data.average_score,
            student_data.total_time_spent,
            student_data.streak_days,
            student_data.completion_rate,
            student_data.login_frequency,
        ]
        
        # Add subject scores if available
        if student_data.subject_scores:
            avg_subject_score = np.mean(list(student_data.subject_scores.values()))
            features.append(avg_subject_score)
        else:
            features.append(student_data.average_score)
        
        return np.array(features).reshape(1, -1)
    
    @staticmethod
    def create_engagement_score(student_data: StudentData) -> float:
        """Calculate engagement score (0-100)"""
        quiz_weight = 0.3
        time_weight = 0.25
        streak_weight = 0.25
        login_weight = 0.2
        
        quiz_score = min(student_data.quizzes_taken / 20, 1.0) * 100
        time_score = min(student_data.total_time_spent / 1000, 1.0) * 100
        streak_score = min(student_data.streak_days / 30, 1.0) * 100
        login_score = min(student_data.login_frequency / 5, 1.0) * 100
        
        engagement = (
            quiz_score * quiz_weight +
            time_score * time_weight +
            streak_score * streak_weight +
            login_score * login_weight
        )
        
        return round(engagement, 2)
    
    @staticmethod
    def create_performance_index(student_data: StudentData) -> float:
        """Calculate performance index (0-100)"""
        score_weight = 0.5
        completion_weight = 0.3
        consistency_weight = 0.2
        
        score_component = student_data.average_score
        completion_component = student_data.completion_rate
        consistency_component = min(student_data.streak_days / 7, 1.0) * 100
        
        performance = (
            score_component * score_weight +
            completion_component * completion_weight +
            consistency_component * consistency_weight
        )
        
        return round(performance, 2)

# ============================================
# PREDICTION SERVICE
# ============================================

class PredictionService:
    """Handles performance prediction with model explainability"""
    
    def __init__(self):
        self.model_name = "performance_predictor"
        self.scaler_name = "performance_scaler"
        
    async def initialize(self):
        """Load or initialize prediction model"""
        model = model_manager.load_model(self.model_name)
        scaler = model_manager.load_scaler(self.scaler_name)
        
        if model is None:
            logger.info("Initializing new prediction model")
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            model_manager.save_model(self.model_name, model, "v1.0.0")
        
        if scaler is None:
            scaler = StandardScaler()
            model_manager.save_scaler(self.scaler_name, scaler)
    
    def predict(self, student_data: StudentData) -> Dict[str, Any]:
        """Make prediction with explanations"""
        try:
            model = model_manager.models.get(self.model_name)
            scaler = model_manager.scalers.get(self.scaler_name)
            
            if model is None:
                # Fallback to statistical prediction
                return self._statistical_prediction(student_data)
            
            # Extract features
            features = FeatureEngineer.extract_features(student_data)
            
            # Scale features
            if scaler:
                features = scaler.transform(features)
            
            # Make prediction
            prediction = model.predict(features)[0]
            prediction = max(0, min(100, prediction))  # Clamp to 0-100
            
            # Calculate confidence based on data quality
            confidence = self._calculate_confidence(student_data)
            
            # Generate feature importance (explainability)
            factors = self._explain_prediction(model, student_data)
            
            # Determine risk level
            risk_level = self._assess_risk(prediction, student_data)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                prediction, student_data, factors
            )
            
            return {
                "predicted_score": round(prediction, 2),
                "confidence": confidence,
                "risk_level": risk_level,
                "factors": factors,
                "recommendations": recommendations,
                "model_version": model_manager.versions.get(self.model_name, "v1.0.0"),
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return self._statistical_prediction(student_data)
    
    def _statistical_prediction(self, student_data: StudentData) -> Dict[str, Any]:
        """Fallback statistical prediction"""
        base_score = student_data.average_score
        
        # Adjust based on engagement
        engagement = FeatureEngineer.create_engagement_score(student_data)
        engagement_factor = (engagement - 50) / 100
        
        # Adjust based on consistency
        consistency_factor = min(student_data.streak_days / 30, 0.2)
        
        prediction = base_score * (1 + engagement_factor * 0.1 + consistency_factor)
        prediction = max(0, min(100, prediction))
        
        return {
            "predicted_score": round(prediction, 2),
            "confidence": 0.6,
            "risk_level": "medium" if prediction < 60 else "low",
            "factors": [
                {"factor": "Current Average", "impact": "high", "value": base_score},
                {"factor": "Engagement", "impact": "medium", "value": engagement},
                {"factor": "Consistency", "impact": "low", "value": student_data.streak_days}
            ],
            "recommendations": self._generate_recommendations(prediction, student_data, []),
            "model_version": "statistical_fallback",
            "generated_at": datetime.now().isoformat()
        }
    
    def _calculate_confidence(self, student_data: StudentData) -> float:
        """Calculate prediction confidence"""
        confidence = 0.5
        
        # More quizzes = higher confidence
        if student_data.quizzes_taken >= 10:
            confidence += 0.2
        elif student_data.quizzes_taken >= 5:
            confidence += 0.1
        
        # Longer streak = higher confidence
        if student_data.streak_days >= 14:
            confidence += 0.15
        elif student_data.streak_days >= 7:
            confidence += 0.1
        
        # More time spent = higher confidence
        if student_data.total_time_spent >= 500:
            confidence += 0.15
        
        return min(0.95, confidence)
    
    def _explain_prediction(self, model, student_data: StudentData) -> List[Dict[str, Any]]:
        """Generate SHAP-style feature importance"""
        factors = []
        
        # Feature names
        feature_names = [
            "Grade Level", "Quizzes Taken", "Average Score",
            "Time Spent", "Streak Days", "Completion Rate",
            "Login Frequency", "Subject Average"
        ]
        
        # Get feature importances if available
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            features = FeatureEngineer.extract_features(student_data)[0]
            
            for i, (name, importance) in enumerate(zip(feature_names, importances)):
                impact = "high" if importance > 0.2 else "medium" if importance > 0.1 else "low"
                factors.append({
                    "factor": name,
                    "impact": impact,
                    "importance": round(importance, 3),
                    "value": round(float(features[i]), 2) if i < len(features) else None
                })
        
        # Sort by importance
        factors.sort(key=lambda x: x.get("importance", 0), reverse=True)
        return factors[:5]  # Top 5 factors
    
    def _assess_risk(self, prediction: float, student_data: StudentData) -> str:
        """Assess risk level based on prediction"""
        if prediction < 40:
            return "critical"
        elif prediction < 60:
            return "high"
        elif prediction < 75:
            return "medium"
        return "low"
    
    def _generate_recommendations(
        self, 
        prediction: float, 
        student_data: StudentData,
        factors: List[Dict]
    ) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        if prediction < 60:
            recommendations.append("Focus on foundational concepts before advancing")
            recommendations.append("Schedule daily 30-minute study sessions")
        
        if student_data.streak_days < 3:
            recommendations.append("Build a consistent daily study habit")
        
        if student_data.completion_rate < 70:
            recommendations.append("Complete all assigned quizzes for better progress tracking")
        
        if student_data.quizzes_taken < 5:
            recommendations.append("Take more practice quizzes to improve accuracy")
        
        if not recommendations:
            recommendations.append("Continue your excellent progress!")
            recommendations.append("Try challenging yourself with advanced topics")
        
        return recommendations

# ============================================
# CLUSTERING SERVICE
# ============================================

class ClusteringService:
    """Handles student clustering for learning behavior analysis"""
    
    def __init__(self):
        self.model_name = "student_clustering"
        self.scaler_name = "clustering_scaler"
        self.n_clusters = 5
        
    async def initialize(self):
        """Load or initialize clustering model"""
        model = model_manager.load_model(self.model_name)
        scaler = model_manager.load_scaler(self.scaler_name)
        
        if model is None:
            logger.info("Initializing new clustering model")
            model = KMeans(n_clusters=self.n_clusters, random_state=42)
            model_manager.save_model(self.model_name, model, "v1.0.0")
        
        if scaler is None:
            scaler = StandardScaler()
            model_manager.save_scaler(self.scaler_name, scaler)
    
    def cluster_students(self, students: List[StudentData]) -> Dict[str, Any]:
        """Cluster students into learning behavior groups"""
        try:
            if len(students) < self.n_clusters:
                return self._heuristic_clustering(students)
            
            model = model_manager.models.get(self.model_name)
            scaler = model_manager.scalers.get(self.scaler_name)
            
            # Extract features for all students
            features = np.array([
                FeatureEngineer.extract_features(s)[0] for s in students
            ])
            
            # Scale features
            if scaler:
                features = scaler.fit_transform(features)
            
            # Fit model if needed
            if hasattr(model, 'labels_') and len(model.labels_) == len(students):
                labels = model.labels_
            else:
                labels = model.fit_predict(features)
            
            # Map cluster IDs to meaningful names
            cluster_names = {
                0: "high_performer",
                1: "consistent_learner",
                2: "irregular_learner",
                3: "at_risk",
                4: "new_student"
            }
            
            # Group students by cluster
            clusters = {name: [] for name in cluster_names.values()}
            for i, student in enumerate(students):
                cluster_name = cluster_names.get(labels[i], f"cluster_{labels[i]}")
                clusters[cluster_name].append(student.student_id)
            
            # Generate cluster profiles
            cluster_profiles = self._generate_cluster_profiles(
                students, labels, cluster_names
            )
            
            return {
                "clusters": clusters,
                "cluster_profiles": cluster_profiles,
                "model_version": model_manager.versions.get(self.model_name, "v1.0.0"),
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Clustering error: {e}")
            return self._heuristic_clustering(students)
    
    def _heuristic_clustering(self, students: List[StudentData]) -> Dict[str, Any]:
        """Fallback heuristic clustering"""
        clusters = {
            "high_performer": [],
            "consistent_learner": [],
            "irregular_learner": [],
            "at_risk": [],
            "new_student": []
        }
        
        for student in students:
            if student.quizzes_taken < 3:
                clusters["new_student"].append(student.student_id)
            elif student.average_score >= 85 and student.streak_days >= 7:
                clusters["high_performer"].append(student.student_id)
            elif student.average_score >= 60 and student.streak_days >= 3:
                clusters["consistent_learner"].append(student.student_id)
            elif student.average_score < 50 or student.streak_days == 0:
                clusters["at_risk"].append(student.student_id)
            else:
                clusters["irregular_learner"].append(student.student_id)
        
        return {
            "clusters": clusters,
            "cluster_profiles": {},
            "model_version": "heuristic_fallback",
            "generated_at": datetime.now().isoformat()
        }
    
    def _generate_cluster_profiles(
        self,
        students: List[StudentData],
        labels: np.ndarray,
        cluster_names: Dict[int, str]
    ) -> Dict[str, Dict[str, Any]]:
        """Generate descriptive profiles for each cluster"""
        profiles = {}
        
        for cluster_id, name in cluster_names.items():
            cluster_students = [
                s for i, s in enumerate(students) if labels[i] == cluster_id
            ]
            
            if not cluster_students:
                continue
            
            avg_score = np.mean([s.average_score for s in cluster_students])
            avg_streak = np.mean([s.streak_days for s in cluster_students])
            avg_quizzes = np.mean([s.quizzes_taken for s in cluster_students])
            
            profiles[name] = {
                "size": len(cluster_students),
                "average_score": round(avg_score, 2),
                "average_streak": round(avg_streak, 2),
                "average_quizzes": round(avg_quizzes, 2),
                "description": self._get_cluster_description(name)
            }
        
        return profiles
    
    def _get_cluster_description(self, cluster_name: str) -> str:
        """Get human-readable cluster description"""
        descriptions = {
            "high_performer": "Students with consistently high scores and strong engagement",
            "consistent_learner": "Students showing steady progress with regular study habits",
            "irregular_learner": "Students with variable performance and inconsistent engagement",
            "at_risk": "Students showing signs of struggle requiring intervention",
            "new_student": "Recently joined students with limited activity history"
        }
        return descriptions.get(cluster_name, "Learning behavior group")

# ============================================
# RISK ASSESSMENT SERVICE
# ============================================

class RiskAssessmentService:
    """Handles dropout risk assessment"""
    
    def __init__(self):
        self.model_name = "risk_assessor"
        
    async def initialize(self):
        """Load or initialize risk assessment model"""
        model = model_manager.load_model(self.model_name)
        
        if model is None:
            logger.info("Initializing new risk assessment model")
            model = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                random_state=42
            )
            model_manager.save_model(self.model_name, model, "v1.0.0")
    
    def assess_risk(self, student_data: StudentData) -> Dict[str, Any]:
        """Assess dropout risk for a student"""
        try:
            risk_factors = []
            risk_score = 0.0
            
            # Score-based risk factors
            if student_data.average_score < 50:
                risk_score += 0.25
                risk_factors.append("Low average score (< 50%)")
            elif student_data.average_score < 60:
                risk_score += 0.15
                risk_factors.append("Below average performance")
            
            # Engagement risk factors
            if student_data.streak_days == 0:
                risk_score += 0.20
                risk_factors.append("No active learning streak")
            elif student_data.streak_days < 3:
                risk_score += 0.10
                risk_factors.append("Inconsistent study habits")
            
            # Activity risk factors
            if student_data.quizzes_taken < 3:
                risk_score += 0.15
                risk_factors.append("Low quiz participation")
            
            if student_data.completion_rate < 50:
                risk_score += 0.15
                risk_factors.append("Low completion rate")
            
            # Login frequency risk
            if student_data.login_frequency < 1:
                risk_score += 0.10
                risk_factors.append("Infrequent logins")
            
            # Cap risk score
            risk_score = min(1.0, risk_score)
            
            # Determine risk level
            if risk_score >= 0.7:
                risk_level = "critical"
                intervention_urgency = "immediate"
            elif risk_score >= 0.5:
                risk_level = "high"
                intervention_urgency = "within_48_hours"
            elif risk_score >= 0.3:
                risk_level = "medium"
                intervention_urgency = "within_week"
            else:
                risk_level = "low"
                intervention_urgency = "routine_monitoring"
            
            # Calculate dropout probability
            dropout_probability = risk_score * 100
            
            # Generate recommendations
            recommendations = self._generate_risk_recommendations(
                risk_level, risk_factors, student_data
            )
            
            return {
                "risk_level": risk_level,
                "risk_score": round(risk_score, 2),
                "risk_factors": risk_factors,
                "dropout_probability": round(dropout_probability, 2),
                "intervention_urgency": intervention_urgency,
                "recommendations": recommendations,
                "model_version": model_manager.versions.get(self.model_name, "v1.0.0"),
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Risk assessment error: {e}")
            return {
                "risk_level": "unknown",
                "risk_score": 0.0,
                "risk_factors": [],
                "dropout_probability": 0.0,
                "intervention_urgency": "unknown",
                "recommendations": ["Unable to assess risk at this time"],
                "model_version": "error",
                "generated_at": datetime.now().isoformat()
            }
    
    def _generate_risk_recommendations(
        self,
        risk_level: str,
        risk_factors: List[str],
        student_data: StudentData
    ) -> List[str]:
        """Generate intervention recommendations"""
        recommendations = []
        
        if risk_level == "critical":
            recommendations.append("Schedule immediate one-on-one counseling session")
            recommendations.append("Contact parents/guardians to discuss concerns")
            recommendations.append("Assign a peer mentor for daily check-ins")
        elif risk_level == "high":
            recommendations.append("Schedule follow-up within 48 hours")
            recommendations.append("Review learning materials for difficulty level")
            recommendations.append("Consider additional tutoring support")
        elif risk_level == "medium":
            recommendations.append("Send encouraging reminder notifications")
            recommendations.append("Suggest joining study groups")
            recommendations.append("Monitor progress weekly")
        else:
            recommendations.append("Continue regular monitoring")
            recommendations.append("Provide positive reinforcement")
        
        # Add specific recommendations based on risk factors
        if "Low average score" in str(risk_factors):
            recommendations.append("Focus on foundational concept review")
        
        if "No active learning streak" in str(risk_factors):
            recommendations.append("Set up daily study reminders")
        
        return recommendations

# ============================================
# RECOMMENDATION SERVICE
# ============================================

class RecommendationService:
    """Handles personalized learning recommendations"""
    
    def generate_recommendations(
        self,
        student_id: str,
        weak_topics: List[str],
        strong_topics: List[str],
        current_grade: int,
        learning_style: str = "mixed"
    ) -> Dict[str, Any]:
        """Generate personalized learning recommendations"""
        
        recommendations = []
        learning_path = []
        practice_sets = []
        
        # Topic-based recommendations
        for topic in weak_topics[:3]:  # Top 3 weak topics
            recommendations.append({
                "type": "topic_review",
                "priority": "high",
                "topic": topic,
                "action": f"Review {topic} fundamentals",
                "estimated_time": "30-45 minutes",
                "resources": [
                    f"Video: {topic} Basics",
                    f"Practice: {topic} Exercises",
                    f"Quiz: {topic} Assessment"
                ]
            })
            
            learning_path.append({
                "step": len(learning_path) + 1,
                "topic": topic,
                "action": "review",
                "difficulty": "foundational"
            })
        
        # Strength-based recommendations
        for topic in strong_topics[:2]:
            recommendations.append({
                "type": "advanced_learning",
                "priority": "medium",
                "topic": topic,
                "action": f"Explore advanced {topic} concepts",
                "estimated_time": "45-60 minutes",
                "resources": [
                    f"Advanced {topic} Problems",
                    f"Challenge: {topic} Mastery"
                ]
            })
        
        # Practice sets based on weak topics
        for i, topic in enumerate(weak_topics[:3]):
            practice_sets.append({
                "id": f"ps_{i+1}",
                "name": f"{topic} Practice Set",
                "topic": topic,
                "questions": 10,
                "difficulty": "adaptive",
                "estimated_time": "20 minutes"
            })
        
        # Study schedule
        study_schedule = {
            "daily_goal": "30-45 minutes",
            "weekly_goal": "5 sessions",
            "recommended_times": ["9:00 AM", "4:00 PM", "7:00 PM"],
            "focus_areas": weak_topics[:3],
            "review_days": ["Saturday"]
        }
        
        return {
            "student_id": student_id,
            "recommendations": recommendations,
            "learning_path": learning_path,
            "practice_sets": practice_sets,
            "study_schedule": study_schedule,
            "generated_at": datetime.now().isoformat()
        }

# ============================================
# RETRAINING SERVICE
# ============================================

class RetrainingService:
    """Handles model retraining and evaluation"""
    
    def __init__(self):
        self.backend_url = CONFIG["BACKEND_URL"]
        
    async def fetch_training_data(self) -> pd.DataFrame:
        """Fetch training data from backend"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.backend_url}/api/analytics/training-data",
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        return pd.DataFrame(data["data"])
                
                logger.warning("Failed to fetch training data from backend")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error fetching training data: {e}")
            return pd.DataFrame()
    
    async def retrain_performance_model(self) -> Dict[str, Any]:
        """Retrain performance prediction model"""
        try:
            df = await self.fetch_training_data()
            
            if len(df) < 50:
                logger.warning("Insufficient data for retraining")
                return {"status": "skipped", "reason": "insufficient_data"}
            
            # Prepare features
            feature_cols = [
                'grade', 'quizzes_taken', 'current_average',
                'total_time_spent', 'streak_days', 'completion_rate'
            ]
            
            X = df[feature_cols].fillna(0)
            y = df['final_score'].fillna(df['current_average'])
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train model
            model = RandomForestRegressor(
                n_estimators=150,
                max_depth=12,
                min_samples_split=5,
                random_state=42
            )
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test_scaled)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)
            
            # Save model
            version = datetime.now().strftime("v%Y%m%d_%H%M%S")
            model_manager.save_model("performance_predictor", model, version)
            model_manager.save_scaler("performance_scaler", scaler)
            
            # Update metrics
            metrics = {
                "rmse": round(rmse, 4),
                "r2_score": round(r2, 4),
                "training_samples": len(X_train),
                "test_samples": len(X_test)
            }
            model_manager.update_metrics("performance_predictor", metrics)
            
            logger.info(f"Performance model retrained successfully (version: {version})")
            
            return {
                "status": "success",
                "version": version,
                "metrics": metrics
            }
        except Exception as e:
            logger.error(f"Retraining error: {e}")
            return {"status": "error", "message": str(e)}
    
    async def retrain_clustering_model(self) -> Dict[str, Any]:
        """Retrain student clustering model"""
        try:
            df = await self.fetch_training_data()
            
            if len(df) < 20:
                return {"status": "skipped", "reason": "insufficient_data"}
            
            feature_cols = [
                'grade', 'quizzes_taken', 'current_average',
                'total_time_spent', 'streak_days'
            ]
            
            X = df[feature_cols].fillna(0)
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train clustering model
            model = KMeans(n_clusters=5, random_state=42, n_init=10)
            model.fit(X_scaled)
            
            # Save model
            version = datetime.now().strftime("v%Y%m%d_%H%M%S")
            model_manager.save_model("student_clustering", model, version)
            model_manager.save_scaler("clustering_scaler", scaler)
            
            logger.info(f"Clustering model retrained successfully (version: {version})")
            
            return {
                "status": "success",
                "version": version,
                "clusters": len(np.unique(model.labels_))
            }
        except Exception as e:
            logger.error(f"Clustering retraining error: {e}")
            return {"status": "error", "message": str(e)}

# ============================================
# FASTAPI APPLICATION
# ============================================

# Initialize services
prediction_service = PredictionService()
clustering_service = ClusteringService()
risk_service = RiskAssessmentService()
recommendation_service = RecommendationService()
retraining_service = RetrainingService()

# Scheduler for retraining
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting LearnSync AI Service...")
    
    # Initialize models
    await prediction_service.initialize()
    await clustering_service.initialize()
    await risk_service.initialize()
    
    # Schedule retraining
    scheduler.add_job(
        retraining_service.retrain_performance_model,
        CronTrigger.from_crontab(CONFIG["RETRAIN_CRON"]),
        id="performance_retrain",
        replace_existing=True
    )
    scheduler.start()
    
    logger.info("LearnSync AI Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down LearnSync AI Service...")
    scheduler.shutdown()
    logger.info("LearnSync AI Service stopped")

# Create FastAPI app
app = FastAPI(
    title="LearnSync AI Service",
    description="AI-powered learning analytics microservice",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint"""
    return {
        "service": "LearnSync AI",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0",
        services={
            "prediction": "available" if "performance_predictor" in model_manager.models else "unavailable",
            "clustering": "available" if "student_clustering" in model_manager.models else "unavailable",
            "risk_assessment": "available" if "risk_assessor" in model_manager.models else "unavailable"
        },
        models_loaded=model_manager.list_models()
    )

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_performance(request: PredictionRequest):
    """Predict student performance"""
    result = prediction_service.predict(request.student_data)
    return PredictionResponse(**result)

@app.post("/cluster", response_model=ClusterResponse, tags=["Clustering"])
async def cluster_students(request: ClusterRequest):
    """Cluster students by learning behavior"""
    result = clustering_service.cluster_students(request.students)
    return ClusterResponse(**result)

@app.post("/assess-risk", response_model=RiskAssessmentResponse, tags=["Risk Assessment"])
async def assess_risk(request: RiskAssessmentRequest):
    """Assess dropout risk for a student"""
    result = risk_service.assess_risk(request.student_data)
    return RiskAssessmentResponse(**result)

@app.post("/recommendations", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(request: RecommendationRequest):
    """Get personalized learning recommendations"""
    result = recommendation_service.generate_recommendations(
        request.student_id,
        request.weak_topics,
        request.strong_topics,
        request.current_grade,
        request.learning_style
    )
    return RecommendationResponse(**result)

@app.post("/retrain", tags=["Admin"])
async def trigger_retraining(background_tasks: BackgroundTasks):
    """Trigger model retraining (admin only)"""
    background_tasks.add_task(retraining_service.retrain_performance_model)
    background_tasks.add_task(retraining_service.retrain_clustering_model)
    
    return {
        "status": "started",
        "message": "Retraining jobs queued",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/models", tags=["Admin"])
async def list_models():
    """List all loaded models and their metrics"""
    models = []
    for model_name in model_manager.list_models():
        metrics = model_manager.get_metrics(model_name)
        models.append({
            "name": model_name,
            "version": model_manager.versions.get(model_name, "unknown"),
            "metrics": metrics
        })
    
    return {
        "models": models,
        "total": len(models)
    }

@app.get("/models/{model_name}/metrics", response_model=ModelMetrics, tags=["Admin"])
async def get_model_metrics(model_name: str):
    """Get metrics for a specific model"""
    metrics = model_manager.get_metrics(model_name)
    version = model_manager.versions.get(model_name, "unknown")
    
    return ModelMetrics(
        model_name=model_name,
        version=version,
        accuracy=metrics.get("accuracy"),
        f1_score=metrics.get("f1_score"),
        rmse=metrics.get("rmse"),
        r2_score=metrics.get("r2_score"),
        last_trained=metrics.get("updated_at", datetime.now().isoformat()),
        training_samples=metrics.get("training_samples", 0),
        is_active=model_name in model_manager.models
    )

# ============================================
# ERROR HANDLERS
# ============================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=CONFIG["WORKERS"],
        log_level=CONFIG["LOG_LEVEL"].lower()
    )
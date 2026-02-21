"""
LearnSync AI - AI Microservice
FastAPI-based microservice for learning analytics and predictions

@author Janak Raj Joshi
@license MIT
"""

import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import ML modules
from src.services.prediction_service import PredictionService
from src.services.clustering_service import ClusteringService
from src.services.recommendation_service import RecommendationService
from src.services.risk_assessment_service import RiskAssessmentService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global service instances
prediction_service = None
clustering_service = None
recommendation_service = None
risk_assessment_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    global prediction_service, clustering_service, recommendation_service, risk_assessment_service
    
    # Startup
    logger.info("Starting AI Microservice...")
    
    # Initialize services
    prediction_service = PredictionService()
    clustering_service = ClusteringService()
    recommendation_service = RecommendationService()
    risk_assessment_service = RiskAssessmentService()
    
    # Load or train models
    await load_or_train_models()
    
    logger.info("AI Microservice started successfully!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Microservice...")

app = FastAPI(
    title="LearnSync AI - AI Microservice",
    description="AI-powered learning analytics and predictions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def load_or_train_models():
    """Load existing models or train new ones"""
    try:
        prediction_service.load_model()
        logger.info("Prediction model loaded")
    except Exception as e:
        logger.warning(f"Could not load prediction model: {e}")
    
    try:
        clustering_service.load_model()
        logger.info("Clustering model loaded")
    except Exception as e:
        logger.warning(f"Could not load clustering model: {e}")

# ============== Pydantic Models ==============

class QuizAttemptData(BaseModel):
    quizId: str
    score: float
    subject: Optional[str] = None
    difficulty: Optional[str] = None
    completedAt: datetime

class ActivityData(BaseModel):
    type: str
    timestamp: datetime
    duration: Optional[int] = None

class StudentData(BaseModel):
    studentId: str
    assignedClass: int
    learningProfile: Dict[str, Any]
    performanceMetrics: Dict[str, Any]
    recentAttempts: List[QuizAttemptData]
    recentActivity: List[ActivityData]

class PerformancePredictionRequest(BaseModel):
    studentId: str
    quizHistory: List[QuizAttemptData]
    currentMetrics: Dict[str, Any]

class RiskAssessmentRequest(BaseModel):
    studentId: str
    activitySummary: Dict[str, Any]
    quizSummary: Dict[str, Any]
    lastActive: Optional[datetime] = None
    streakDays: int = 0

class ClusteringRequest(BaseModel):
    studentId: str
    performanceMetrics: Dict[str, Any]
    quizHistory: List[QuizAttemptData]
    activityPattern: List[Dict[str, Any]]

class ComprehensiveAnalysisRequest(BaseModel):
    studentId: str
    assignedClass: int
    performanceMetrics: Dict[str, Any]
    quizHistory: List[QuizAttemptData]
    activityData: List[ActivityData]

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    weakTopics: List[Dict[str, Any]]
    studyPlan: Optional[Dict[str, Any]] = None

class PerformancePredictionResponse(BaseModel):
    predictedScore: float
    confidence: float
    trend: str
    factors: List[str]

class RiskAssessmentResponse(BaseModel):
    riskLevel: str
    riskScore: float
    factors: List[str]
    recommendations: List[str]

class ClusteringResponse(BaseModel):
    cluster: str
    confidence: float
    characteristics: List[str]

# ============== API Endpoints ==============

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "LearnSync AI - AI Microservice",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/health",
            "/recommendations",
            "/predict-performance",
            "/risk-assessment",
            "/learning-cluster",
            "/comprehensive-analysis"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "prediction": prediction_service is not None,
            "clustering": clustering_service is not None,
            "recommendation": recommendation_service is not None,
            "risk_assessment": risk_assessment_service is not None
        }
    }

@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(data: StudentData):
    """Get personalized recommendations for a student"""
    try:
        logger.info(f"Generating recommendations for student: {data.studentId}")
        
        recommendations = recommendation_service.generate_recommendations(
            student_data=data.dict()
        )
        
        return RecommendationResponse(
            recommendations=recommendations.get("recommendations", []),
            weakTopics=recommendations.get("weakTopics", []),
            studyPlan=recommendations.get("studyPlan")
        )
    
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-performance", response_model=PerformancePredictionResponse)
async def predict_performance(data: PerformancePredictionRequest):
    """Predict student's next quiz performance"""
    try:
        logger.info(f"Predicting performance for student: {data.studentId}")
        
        prediction = prediction_service.predict_performance(
            quiz_history=[attempt.dict() for attempt in data.quizHistory],
            current_metrics=data.currentMetrics
        )
        
        return PerformancePredictionResponse(
            predictedScore=prediction["predicted_score"],
            confidence=prediction["confidence"],
            trend=prediction["trend"],
            factors=prediction["factors"]
        )
    
    except Exception as e:
        logger.error(f"Error predicting performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/risk-assessment", response_model=RiskAssessmentResponse)
async def assess_risk(data: RiskAssessmentRequest):
    """Assess dropout risk for a student"""
    try:
        logger.info(f"Assessing risk for student: {data.studentId}")
        
        assessment = risk_assessment_service.assess_risk(
            activity_summary=data.activitySummary,
            quiz_summary=data.quizSummary,
            last_active=data.lastActive,
            streak_days=data.streakDays
        )
        
        return RiskAssessmentResponse(
            riskLevel=assessment["risk_level"],
            riskScore=assessment["risk_score"],
            factors=assessment["factors"],
            recommendations=assessment["recommendations"]
        )
    
    except Exception as e:
        logger.error(f"Error assessing risk: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/learning-cluster", response_model=ClusteringResponse)
async def classify_cluster(data: ClusteringRequest):
    """Classify student into learning cluster"""
    try:
        logger.info(f"Classifying cluster for student: {data.studentId}")
        
        classification = clustering_service.classify_student(
            performance_metrics=data.performanceMetrics,
            quiz_history=[attempt.dict() for attempt in data.quizHistory],
            activity_pattern=data.activityPattern
        )
        
        return ClusteringResponse(
            cluster=classification["cluster"],
            confidence=classification["confidence"],
            characteristics=classification["characteristics"]
        )
    
    except Exception as e:
        logger.error(f"Error classifying cluster: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/comprehensive-analysis")
async def comprehensive_analysis(data: ComprehensiveAnalysisRequest):
    """Run comprehensive AI analysis on a student"""
    try:
        logger.info(f"Running comprehensive analysis for student: {data.studentId}")
        
        # Run all analyses
        prediction = prediction_service.predict_performance(
            quiz_history=[attempt.dict() for attempt in data.quizHistory],
            current_metrics=data.performanceMetrics
        )
        
        risk = risk_assessment_service.assess_risk_from_activity(
            activity_data=[activity.dict() for activity in data.activityData],
            quiz_history=[attempt.dict() for attempt in data.quizHistory]
        )
        
        cluster = clustering_service.classify_student(
            performance_metrics=data.performanceMetrics,
            quiz_history=[attempt.dict() for attempt in data.quizHistory],
            activity_pattern=[]
        )
        
        recommendations = recommendation_service.generate_recommendations(
            student_data=data.dict()
        )
        
        # Identify weak topics
        weak_topics = prediction_service.identify_weak_topics(
            quiz_history=[attempt.dict() for attempt in data.quizHistory]
        )
        
        return {
            "predictedPerformance": prediction["predicted_score"],
            "riskLevel": risk["risk_level"],
            "learningCluster": cluster["cluster"],
            "weakTopics": weak_topics,
            "recommendations": recommendations.get("recommendations", []),
            "analysisTimestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quick-analysis")
async def quick_analysis(data: dict):
    """Quick analysis for batch processing"""
    try:
        student_id = data.get("studentId")
        quiz_history = data.get("quizHistory", [])
        
        # Simple prediction based on recent scores
        if quiz_history:
            scores = [q["score"] for q in quiz_history]
            avg_score = np.mean(scores)
            trend = "improving" if len(scores) > 1 and scores[0] > scores[-1] else "stable"
        else:
            avg_score = 0
            trend = "new"
        
        # Simple risk assessment
        if len(quiz_history) < 3:
            risk_level = "medium"
        elif avg_score < 50:
            risk_level = "high"
        elif avg_score < 70:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Simple clustering
        if avg_score >= 80:
            cluster = "high_performer"
        elif avg_score >= 60:
            cluster = "consistent_learner"
        elif len(quiz_history) < 3:
            cluster = "new"
        else:
            cluster = "irregular_learner"
        
        return {
            "predictedPerformance": round(avg_score, 1),
            "riskLevel": risk_level,
            "learningCluster": cluster,
            "trend": trend
        }
    
    except Exception as e:
        logger.error(f"Error in quick analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train-models")
async def train_models(background_tasks: BackgroundTasks):
    """Retrain all ML models (admin only)"""
    try:
        background_tasks.add_task(train_all_models)
        return {
            "message": "Model training started in background",
            "status": "training"
        }
    except Exception as e:
        logger.error(f"Error starting model training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def train_all_models():
    """Train all models with current data"""
    try:
        logger.info("Starting model training...")
        
        # Train prediction model
        prediction_service.train_model()
        
        # Train clustering model
        clustering_service.train_model()
        
        logger.info("Model training completed!")
    
    except Exception as e:
        logger.error(f"Error training models: {e}")

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.environ.get("DEBUG", "false").lower() == "true",
        log_level="info"
    )
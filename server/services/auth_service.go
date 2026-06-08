package services

import (
	"errors"

	"github.com/neighbortask/server/config"
	"github.com/neighbortask/server/models"
	"github.com/neighbortask/server/repositories"
	"github.com/neighbortask/server/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	userRepo *repositories.UserRepo
	cfg      *config.Config
}

func NewAuthService(userRepo *repositories.UserRepo, cfg *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, cfg: cfg}
}

type RegisterRequest struct {
	Username  string   `json:"username" binding:"required,min=2,max=50"`
	Email     string   `json:"email" binding:"required,email"`
	Phone     string   `json:"phone" binding:"required"`
	Password  string   `json:"password" binding:"required,min=6"`
	Avatar    string   `json:"avatar"`
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
}

type LoginRequest struct {
	Account  string `json:"account" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

func (s *AuthService) Register(req RegisterRequest) (*models.User, *TokenResponse, error) {
	existing, err := s.userRepo.FindByPhone(req.Phone)
	if err == nil && existing != nil {
		return nil, nil, errors.New("phone already registered")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}

	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		Phone:        req.Phone,
		PasswordHash: string(hashedPassword),
		Avatar:       req.Avatar,
		Role:         "user",
		CreditScore:  100,
		Balance:      0,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, nil, err
	}

	tokens, err := s.generateTokens(user.ID, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) Login(req LoginRequest) (*models.User, *TokenResponse, error) {
	var user *models.User
	var err error

	user, err = s.userRepo.FindByPhone(req.Account)
	if err != nil || user == nil {
		user, err = s.userRepo.FindByEmail(req.Account)
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("invalid account or password")
		}
		return nil, nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, nil, errors.New("invalid account or password")
	}

	tokens, err := s.generateTokens(user.ID, user.Role)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) RefreshToken(refreshToken string) (*TokenResponse, error) {
	claims, err := utils.ParseToken(refreshToken, s.cfg.JWT.RefreshSecret)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	tokens, err := s.generateTokens(user.ID, user.Role)
	if err != nil {
		return nil, err
	}

	return tokens, nil
}

func (s *AuthService) GetCurrentUser(userID uint) (*models.User, error) {
	return s.userRepo.FindByID(userID)
}

func (s *AuthService) generateTokens(userID uint, role string) (*TokenResponse, error) {
	accessToken, err := utils.GenerateAccessToken(userID, role, s.cfg.JWT.AccessSecret, s.cfg.JWT.AccessExpiry)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(userID, role, s.cfg.JWT.RefreshSecret, s.cfg.JWT.RefreshExpiry)
	if err != nil {
		return nil, err
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    s.cfg.JWT.AccessExpiry * 60,
	}, nil
}

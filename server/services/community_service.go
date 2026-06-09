package services

import (
	"errors"

	"github.com/neighbortask/server/models"
	"github.com/neighbortask/server/repositories"
)

type CommunityService struct {
	communityRepo *repositories.CommunityRepo
	userRepo      *repositories.UserRepo
}

func NewCommunityService(communityRepo *repositories.CommunityRepo, userRepo *repositories.UserRepo) *CommunityService {
	return &CommunityService{communityRepo: communityRepo, userRepo: userRepo}
}

type JoinByCodeRequest struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

type JoinByLocationRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Radius    float64 `json:"radius"`
}

type JoinRequest struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

type JoinByLocationNewRequest struct {
	CommunityID uint    `json:"community_id"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Radius      float64 `json:"radius"`
}

func (s *CommunityService) List(page, perPage int) ([]models.Community, int64, error) {
	return s.communityRepo.List(page, perPage)
}

func (s *CommunityService) GetByID(id uint) (*models.Community, error) {
	return s.communityRepo.FindByID(id)
}

func (s *CommunityService) JoinByCode(userID uint, req JoinByCodeRequest) (*models.Community, error) {
	community, err := s.communityRepo.FindByInviteCode(req.InviteCode)
	if err != nil {
		return nil, errors.New("invalid invite code")
	}

	isMember, err := s.communityRepo.IsMember(community.ID, userID)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, errors.New("already a member")
	}

	member := &models.CommunityMember{
		CommunityID: community.ID,
		UserID:      userID,
	}
	if err := s.communityRepo.AddMember(member); err != nil {
		return nil, err
	}

	s.communityRepo.IncrementMemberCount(community.ID)
	s.userRepo.UpdateCommunity(userID, &community.ID)

	return community, nil
}

func (s *CommunityService) JoinByLocation(userID uint, req JoinByLocationRequest) (*models.Community, error) {
	radius := req.Radius
	if radius <= 0 {
		radius = 3000
	}

	communities, err := s.communityRepo.FindNearby(req.Latitude, req.Longitude, radius)
	if err != nil {
		return nil, err
	}

	if len(communities) == 0 {
		return nil, errors.New("no communities found nearby")
	}

	community := &communities[0]

	isMember, err := s.communityRepo.IsMember(community.ID, userID)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, errors.New("already a member")
	}

	member := &models.CommunityMember{
		CommunityID: community.ID,
		UserID:      userID,
	}
	if err := s.communityRepo.AddMember(member); err != nil {
		return nil, err
	}

	s.communityRepo.IncrementMemberCount(community.ID)
	s.userRepo.UpdateCommunity(userID, &community.ID)

	return community, nil
}

func (s *CommunityService) Join(userID uint, req JoinRequest) (*models.Community, error) {
	codeReq := JoinByCodeRequest{InviteCode: req.InviteCode}
	return s.JoinByCode(userID, codeReq)
}

func (s *CommunityService) JoinByID(userID, communityID uint) (*models.Community, error) {
	community, err := s.communityRepo.FindByID(communityID)
	if err != nil {
		return nil, errors.New("community not found")
	}

	isMember, err := s.communityRepo.IsMember(community.ID, userID)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, errors.New("already a member")
	}

	member := &models.CommunityMember{
		CommunityID: community.ID,
		UserID:      userID,
	}
	if err := s.communityRepo.AddMember(member); err != nil {
		return nil, err
	}

	s.communityRepo.IncrementMemberCount(community.ID)
	s.userRepo.UpdateCommunity(userID, &community.ID)

	return community, nil
}

func (s *CommunityService) JoinByLocationNew(userID uint, req JoinByLocationNewRequest) (*models.Community, error) {
	if req.CommunityID > 0 {
		return s.JoinByID(userID, req.CommunityID)
	}
	locReq := JoinByLocationRequest{
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
		Radius:    req.Radius,
	}
	return s.JoinByLocation(userID, locReq)
}

func (s *CommunityService) GetMembers(communityID uint, page, perPage int) ([]models.CommunityMember, int64, error) {
	return s.communityRepo.GetMembers(communityID, page, perPage)
}

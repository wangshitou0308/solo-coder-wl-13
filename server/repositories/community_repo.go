package repositories

import (
	"math/rand"
	"time"

	"github.com/neighbortask/server/models"
	"gorm.io/gorm"
)

type CommunityRepo struct {
	db *gorm.DB
}

func NewCommunityRepo(db *gorm.DB) *CommunityRepo {
	return &CommunityRepo{db: db}
}

func (r *CommunityRepo) Create(community *models.Community) error {
	return r.db.Create(community).Error
}

func (r *CommunityRepo) FindByID(id uint) (*models.Community, error) {
	var community models.Community
	err := r.db.Preload("Admin").First(&community, id).Error
	return &community, err
}

func (r *CommunityRepo) FindByInviteCode(code string) (*models.Community, error) {
	var community models.Community
	err := r.db.Where("invite_code = ?", code).First(&community).Error
	return &community, err
}

func (r *CommunityRepo) List(page, perPage int) ([]models.Community, int64, error) {
	var communities []models.Community
	var total int64

	r.db.Model(&models.Community{}).Count(&total)

	offset := (page - 1) * perPage
	err := r.db.Preload("Admin").Offset(offset).Limit(perPage).
		Order("created_at DESC").Find(&communities).Error

	return communities, total, err
}

func (r *CommunityRepo) FindNearby(lat, lng float64, radius float64) ([]models.Community, error) {
	var communities []models.Community
	latRange := radius / 111000.0
	lngRange := radius / (111320.0 * 0.866)

	err := r.db.Where("latitude BETWEEN ? AND ?", lat-latRange, lat+latRange).
		Where("longitude BETWEEN ? AND ?", lng-lngRange, lng+lngRange).
		Find(&communities).Error

	return communities, err
}

func (r *CommunityRepo) Update(community *models.Community) error {
	return r.db.Save(community).Error
}

func (r *CommunityRepo) IncrementMemberCount(id uint) error {
	return r.db.Model(&models.Community{}).Where("id = ?", id).
		Update("member_count", gorm.Expr("member_count + 1")).Error
}

func (r *CommunityRepo) AddMember(member *models.CommunityMember) error {
	return r.db.Create(member).Error
}

func (r *CommunityRepo) IsMember(communityID, userID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.CommunityMember{}).
		Where("community_id = ? AND user_id = ?", communityID, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *CommunityRepo) GetMembers(communityID uint, page, perPage int) ([]models.CommunityMember, int64, error) {
	var members []models.CommunityMember
	var total int64

	r.db.Model(&models.CommunityMember{}).Where("community_id = ?", communityID).Count(&total)

	offset := (page - 1) * perPage
	err := r.db.Preload("User").Where("community_id = ?", communityID).
		Offset(offset).Limit(perPage).Order("joined_at DESC").Find(&members).Error

	return members, total, err
}

func GenerateInviteCode() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())
	b := make([]byte, 6)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

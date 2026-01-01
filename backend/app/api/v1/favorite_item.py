from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.favorite_item import FavoriteItem
from app.api.v1.auth import get_current_user
from app.schemas.favorite_item import (
    FavoriteItemCreate,
    FavoriteItemUpdate,
    FavoriteItemResponse,
)

router = APIRouter()


@router.get("/favorite-items", response_model=List[FavoriteItemResponse])
def get_favorite_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """현재 사용자의 자주 사용하는 품목 조회 (삭제되지 않은 것만)"""
    items = (
        db.query(FavoriteItem)
        .filter(
            FavoriteItem.user_id == current_user.id,
            FavoriteItem.is_deleted == False,
        )
        .order_by(FavoriteItem.created_at.desc())
        .all()
    )
    return items


@router.post(
    "/favorite-items", response_model=FavoriteItemResponse, status_code=status.HTTP_201_CREATED
)
def create_favorite_item(
    item: FavoriteItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """자주 사용하는 품목 추가"""
    try:
        db_item = FavoriteItem(
            user_id=current_user.id,
            name=item.name,
            specification=item.specification,
            unit_price=item.unit_price,
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"품목 추가 중 오류가 발생했습니다: {str(e)}",
        )


@router.put("/favorite-items/{item_id}", response_model=FavoriteItemResponse)
def update_favorite_item(
    item_id: int,
    item_update: FavoriteItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """자주 사용하는 품목 수정"""
    db_item = (
        db.query(FavoriteItem)
        .filter(
            FavoriteItem.id == item_id,
            FavoriteItem.user_id == current_user.id,
            FavoriteItem.is_deleted == False,
        )
        .first()
    )

    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="품목을 찾을 수 없습니다.",
        )

    try:
        update_data = item_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)

        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"품목 수정 중 오류가 발생했습니다: {str(e)}",
        )


@router.delete("/favorite-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """자주 사용하는 품목 삭제 (soft delete)"""
    db_item = (
        db.query(FavoriteItem)
        .filter(
            FavoriteItem.id == item_id,
            FavoriteItem.user_id == current_user.id,
            FavoriteItem.is_deleted == False,
        )
        .first()
    )

    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="품목을 찾을 수 없습니다.",
        )

    try:
        db_item.is_deleted = True
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"품목 삭제 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/favorite-items/migrate", response_model=List[FavoriteItemResponse])
def migrate_favorite_items(
    items: List[FavoriteItemCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """로컬 스토리지에서 마이그레이션 (기존 데이터가 있으면 서버로 이전)"""
    try:
        created_items = []
        for item_data in items:
            # 중복 확인 (이름 기준)
            existing = (
                db.query(FavoriteItem)
                .filter(
                    FavoriteItem.user_id == current_user.id,
                    FavoriteItem.name == item_data.name,
                    FavoriteItem.is_deleted == False,
                )
                .first()
            )

            if not existing:
                db_item = FavoriteItem(
                    user_id=current_user.id,
                    name=item_data.name,
                    specification=item_data.specification,
                    unit_price=item_data.unit_price,
                )
                db.add(db_item)
                created_items.append(db_item)

        db.commit()
        for item in created_items:
            db.refresh(item)
        return created_items
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"품목 마이그레이션 중 오류가 발생했습니다: {str(e)}",
        )


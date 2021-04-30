#include "progressaction.h"
#include <QPainter>
#include <QDebug>
#include <QHBoxLayout>
#include <QPixmap>

ProgressAction::ProgressAction(QWidget *parent)
    : QWidget(parent)
{
    if(parent){
        resize(parent->width(),parent->height());
        setMinimumHeight(parent->height());
    }
}

ProgressAction::~ProgressAction()
{

}

void ProgressAction::setBgPic(const QString &iPath)
{
    mBgPath = iPath;
}

void ProgressAction::setIconPic(const QString &iPath)
{
    mIconPath = iPath;
}

void ProgressAction::setText(const QString &iText)
{
    mText = iText;
}

void ProgressAction::setRange(int minimum, int maximum)
{
    mMin = minimum;
    mMax = maximum;
}

void ProgressAction::setValue(int value)
{
    mValue = value;
}

void ProgressAction::setType(ProgressAction::Type iType)
{
    mType = iType;
}

void ProgressAction::setOrientation(ProgressAction::Orientation iOrientation)
{
    mOrientation = iOrientation;
}

void ProgressAction::setBgColor(const QString &iColor)
{
    mBgColor = iColor;
}

void ProgressAction::setProgressColor(const QString &iColor)
{
    mProgressColor = iColor;
}

void ProgressAction::setBgVisible(bool isVisible)
{
    mIsVisible = isVisible;
}

void ProgressAction::drawBgPic(QPainter &painter)
{
    QPixmap pix;
    pix.load(mBgPath);
    QRect rectangle(0, 0,
                    mWidth, mHeight);
    painter.drawPixmap(rectangle,pix);
    update();
}

void ProgressAction::drawIconPic(QPainter &painter)
{
    QPixmap pix;
    pix.load(mIconPath);
    if(mWidth < mHeight){
        QRect rectangle(mWidth/5.5, mWidth/5.5,
                        mWidth/1.5, mWidth/1.5);
        painter.drawPixmap(rectangle,pix);
    }else{
        QRect rectangle(mHeight/5.5, mHeight/5.5,
                        mHeight/1.5, mHeight/1.5);
        painter.drawPixmap(rectangle,pix);
    }
    update();
}

void ProgressAction::drawText(QPainter &painter)
{
    QPen pen = painter.pen();
    pen.setColor(Qt::white);
    painter.setPen(pen);
    QFont font;
    font.setPointSize(mHeight/6);
    font.setWeight(mHeight/20);
    painter.setFont(font);
    //    if(mWidth < mHeight){
    //        QRectF rectangle(mWidth, mWidth/2.8,
    //                         mWidth, mWidth);
    //        painter.drawText(rectangle,mText);
    //    }else{
    //        QRectF rectangle(mHeight, mHeight/2.8,
    //                         mHeight, mHeight);
    //        painter.drawText(rectangle,mText);
    //    }

    QPointF point;
    point.setX(0.3 * mWidth);
    point.setY(0.6 * mHeight);
    painter.drawText(point,mText);
    update();
}

void ProgressAction::drawBgFigure(QPainter &painter)
{
    painter.setPen(QPen(QColor(mBgColor)));
    painter.setBrush(QBrush(QColor(mBgColor)));

    //    if(mWidth < mHeight){
    //        QRect rectangle(mHeight - mWidth , mWidth/10,
    //                        mWidth/1.2, mWidth/1.2);
    //        painter.drawEllipse(rectangle);
    //    }else{
    //        QRect rectangle(mWidth - mHeight, mHeight/10,
    //                        mHeight/1.2, mHeight/1.2);
    //        painter.drawEllipse(rectangle);
    //    }
    int siding = 10;
    if(mWidth < mHeight){
        QRectF rectangle(2.5* mWidth, 0 + mWidth/siding, mWidth - 2 * mWidth/siding, mWidth - 2 * mWidth/siding);
        painter.drawEllipse(rectangle);
    }else{
        QRectF rectangle(2.5* mHeight, 0 + mHeight/siding, mHeight - 2 * mHeight/siding, mHeight - 2 * mHeight/siding);
        painter.drawEllipse(rectangle);
    }
    update();
}

void ProgressAction::drawProgressFigure(QPainter &painter)
{
    double percent;
    int siding = 10;
    if(mType == Arc){
        QPen pen = painter.pen();
        QColor color = QColor(mProgressColor);
        if(mOrientation == Clockwise){
            percent = -360*(mValue - mMin)/(mMax - mMin);
        }else{
            percent = 360*(mValue - mMin)/(mMax - mMin);
        }

        if(mWidth < mHeight){
            pen.setWidth(mWidth/20);
            color.setAlpha(100);
            pen.setColor(color);
            painter.setPen(pen);
            QRectF rectangleAll(25.5*mWidth/siding, 1.5*mWidth/siding,
                                mWidth- 3*mWidth/siding, mWidth- 3*mWidth/siding);
            painter.drawArc(rectangleAll,16*90,16*360);

            pen.setWidth(mWidth/20);
            color.setAlpha(255);
            pen.setColor(color);
            painter.setPen(pen);
            QRectF rectangle(25.5*mWidth/siding, 1.5*mWidth/siding,
                             mWidth- 3*mWidth/siding, mWidth- 3*mWidth/siding);
            painter.drawArc(rectangle,16*90,16*percent);
            //            QRect rectangle(mHeight - mWidth*0.94, mWidth/6,
            //                            mWidth/1.4, mWidth/1.4);
            painter.drawArc(rectangle,16*90,16*percent);
        }else{
            pen.setWidth(mHeight/20);
            color.setAlpha(100);
            pen.setColor(color);
            painter.setPen(pen);
            QRectF rectangleAll(25.5*mHeight/siding, 1.5*mHeight/siding,
                                mHeight- 3*mHeight/siding, mHeight- 3*mHeight/siding);
            painter.drawArc(rectangleAll,16*90,16*360);

            pen.setWidth(mHeight/20);
            color.setAlpha(255);
            pen.setColor(color);
            painter.setPen(pen);
            QRectF rectangle(25.5*mHeight/siding, 1.5*mHeight/siding,
                             mHeight- 3*mHeight/siding, mHeight- 3*mHeight/siding);
            painter.drawArc(rectangle,16*90,16*percent);
            //            QRect rectangle(mWidth - mHeight*0.94, mHeight/6,
            //                            mHeight/1.4, mHeight/1.4);
            painter.drawArc(rectangle,16*90,16*percent);
        }
    }else if(mType == Pool){
        percent = 360*(mValue - mMin)/(mMax - mMin);
        painter.setBrush(QBrush(QColor(mProgressColor)));
        if(mWidth < mHeight){
            QRectF rectangle(25*mWidth/siding,0 + mWidth/siding,
                             mWidth - 2* mWidth/siding, mWidth - 2* mWidth/siding);
            painter.drawChord(rectangle,16*(540-percent)/2,16*percent);
        }else{
            QRectF rectangle(25*mHeight/siding,0 + mHeight/siding,
                             mHeight - 2* mHeight/siding, mHeight - 2* mHeight/siding);
            painter.drawChord(rectangle,16*(540-percent)/2,16*percent);
        }

    }else if(mType == Text){
        double percent = mValue;
        QString percentStr = QString("%1").arg(percent);
        QPen pen = painter.pen();
        pen.setColor(Qt::white);
        painter.setPen(pen);
        QFont font;
        //        if(mWidth < mHeight){
        //            font.setPointSize(mWidth/3);
        //            painter.setFont(font);
        ////            QRectF rectangle(2.7*mWidth, mWidth/3.2,
        ////                             mWidth/2, mWidth/2);
        ////            //        QRect rectangle(mHeight - mWidth*0.8, mWidth/2.7,
        ////            //                        mWidth/1.4, mWidth/1.4);
        ////            painter.drawText(rectangle,percentStr);

        //        }else{
        font.setPointSize(mHeight/4);
        painter.setFont(font);
        //            QRectF rectangle(2.7*mHeight, mHeight/3.2,
        //                             mHeight/2, mHeight/2);
        //            //        QRect rectangle(mWidth - mHeight*0.8, mHeight/2.7,
        //            //                        mHeight/1.4, mHeight/1.4);
        //            painter.drawText(rectangle,percentStr);
        //        QPointF point;
        //        point.setX(0.7 * mWidth);
        //        point.setY(0.65 * mHeight);
        //        painter.drawText(point,percentStr);

        int count = percentStr.count();
        //count = 5的优先值
        double cx = 0.65;
        double cy = 0.65;
        double x = 0.00;
        if(count <= 5){
            //cx = cx + 0.7 * (5 - count);
            x = cx * mWidth + 0.35 * mWidth * (5 - count) / 5;
        }else{
            //cx = cx - 0.13 * (count - 5);
            x = cx * mWidth - 0.35 *mWidth * (count - 5) / 5;
        }

        QPointF point;
        //point.setX(cx * mWidth);
        point.setX(x);
        point.setY(cy * mHeight);
        painter.drawText(point,percentStr);
    }
    update();
    //    }
}

void ProgressAction::drawPercent(QPainter &painter)
{
    double percent = 100*(mValue - mMin)/(mMax - mMin);
    QString percentStr = QString("%1%").arg(percent);
    QPen pen = painter.pen();
    pen.setColor(Qt::white);
    painter.setPen(pen);
    QFont font;

    //    if(mWidth < mHeight){
    //        font.setPointSize(mWidth/5);
    //        painter.setFont(font);
    //        QRectF rectangle(2.7*mWidth, mWidth/2.7,
    //                         mWidth/2, mWidth/2);
    //        //        QRect rectangle(mHeight - mWidth*0.8, mWidth/2.7,
    //        //                        mWidth/1.4, mWidth/1.4);
    //        painter.drawText(rectangle,percentStr);
    //    }else{
    font.setPointSize(mHeight/5);
    painter.setFont(font);
    //        QRectF rectangle(2.7*mHeight, mHeight/2.7,
    //                         mHeight/2, mHeight/2);
    //        //        QRect rectangle(mWidth - mHeight*0.8, mHeight/2.7,
    //        //                        mHeight/1.4, mHeight/1.4);
    //        painter.drawText(rectangle,percentStr);
    int count = percentStr.count();
    if(count == 2){
        font.setPointSize(mHeight/5);
        painter.setFont(font);
        QPointF point;
        point.setX(0.78 * mWidth);
        point.setY(0.6 * mHeight);
        painter.drawText(point,percentStr);
    }else if(count == 3){
        font.setPointSize(mHeight/5);
        painter.setFont(font);
        QPointF point;
        point.setX(0.76 * mWidth);
        point.setY(0.6 * mHeight);
        painter.drawText(point,percentStr);
    }else if(count == 4){
        font.setPointSize(mHeight/5.7);
        painter.setFont(font);
        QPointF point;
        point.setX(0.75 * mWidth);
        point.setY(0.6 * mHeight);
        painter.drawText(point,percentStr);
    }else{
        font.setPointSize(mHeight/6.7);
        painter.setFont(font);
        QPointF point;
        point.setX(0.74 * mWidth);
        point.setY(0.6 * mHeight);
        painter.drawText(point,percentStr);
    }
    //    }

    //    if(percent < 10){
    //        if(width() < height()){
    //            font.setPointSize(width()/5);
    //            painter.setFont(font);
    //            QRectF rectangle(width()/3, width()/3,
    //                             width()/2, width()/2);
    //            painter.drawText(rectangle,percentStr);
    //        }else{
    //            font.setPointSize(height()/5);
    //            painter.setFont(font);
    //            QRectF rectangle(height()/3, height()/3,
    //                             height()/2, height()/2);
    //            painter.drawText(rectangle,percentStr);
    //        }
    //    }else if(percent >= 10 && percent <100){
    //        if(width() < height()){
    //            font.setPointSize(width()/5);
    //            painter.setFont(font);
    //            QRectF rectangle(width()/4.5, width()/3,
    //                             width()/1.5, width()/1.5);
    //            painter.drawText(rectangle,percentStr);
    //        }else{
    //            font.setPointSize(height()/5);
    //            painter.setFont(font);
    //            QRectF rectangle(height()/4.5, height()/3,
    //                             height()/1.5, height()/1.5);
    //            painter.drawText(rectangle,percentStr);
    //        }
    //    }else {
    //        if(width() < height()){
    //            font.setPointSize(width()/5);
    //            painter.setFont(font);
    //            QRectF rectangle(width()/6.5, width()/3,
    //                             width()/1.2, width()/1.5);
    //            painter.drawText(rectangle,percentStr);
    //        }else{
    //            font.setPointSize(height()/5);
    //            painter.setFont(font);
    //            QRectF rectangle(height()/6.5, height()/3,
    //                             height()/1.2, height()/1.5);
    //            painter.drawText(rectangle,percentStr);
    //        }
    //    }
    update();
}

void ProgressAction::paintEvent(QPaintEvent *)
{
    QPainter painter(this);
    painter.setRenderHints(QPainter::Antialiasing | QPainter::TextAntialiasing);
    drawBgPic(painter);
    drawIconPic(painter);
    drawText(painter);
    if(mIsVisible){
        drawBgFigure(painter);
    }
    drawProgressFigure(painter);
    if(mType != Text){
        drawPercent(painter);
    }
}

void ProgressAction::resizeEvent(QResizeEvent *)
{
    mHeight = height();
    mWidth = width();
    mHeight = mWidth/3.5;
}

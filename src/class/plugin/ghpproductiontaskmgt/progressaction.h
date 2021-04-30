#ifndef PROGRESSACTION_H
#define PROGRESSACTION_H
#include <QWidget>

class ProgressAction : public QWidget
{
    Q_OBJECT
public:
    explicit ProgressAction(QWidget *parent = 0);
    ~ProgressAction();
    enum Type{Arc,Pool,Text};
    enum Orientation{Clockwise,AntiClockwise};

public slots:
    void setBgPic(const QString &iPath);
    void setIconPic(const QString &iPath);
    void setText(const QString &iText);
    void setRange(int minimum,int maximum);
    void setValue(int value);
    void setType(Type iType);
    void setOrientation(Orientation iOrientation);
    void setBgColor(const QString &iColor = "#464646");
    void setProgressColor(const QString &iColor = "#64B8FF");
    void setBgVisible(bool isVisible);

protected:
    void paintEvent(QPaintEvent *);
    void resizeEvent(QResizeEvent *) override;

private:
    void drawBgPic(QPainter &painter);
    void drawIconPic(QPainter &painter);
    void drawText(QPainter &painter);
    void drawBgFigure(QPainter &painter);
    void drawProgressFigure(QPainter &painter);
    void drawPercent(QPainter &painter);

private:
    QString mBgPath = "";
    QString mIconPath = "";
    QString mText = "";
    int mMin = 0;
    int mMax = 100;
    int mValue = 0;
    Type mType = Arc;
    Orientation mOrientation = AntiClockwise;
    QString mBgColor = "#464646";
    QString mProgressColor = "#FFFFFF";
    double mHeight = 0;
    double mWidth = 0;
    bool mIsVisible = true;
};

#endif // PROGRESSACTION_H

TEX=latexmk
TEXFLAGS=-pdf -interaction=nonstopmode -halt-on-error
TARGET=presentation

all: $(TARGET).pdf

$(TARGET).pdf: $(TARGET).tex
	$(TEX) $(TEXFLAGS) $(TARGET).tex

clean:
	$(TEX) -C $(TARGET).tex

.PHONY: all clean


<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/09d69802-1720-48a0-81f7-7616c2caa981" />

# 리설주 1.0

RiSolJu 1.0은 북한식 문체, 어휘, 말투, 배경 맥락을 반영하도록 조정한 한국어 대화형 언어 모델입니다.

이 GitHub 저장소는 모델 소개와 Hugging Face 링크를 제공하기 위한 간단한 공개 저장소입니다. 전체 모델 파일, 토크나이저, 설정 파일은 Hugging Face에 업로드되어 있습니다.

- [risolju-1.0-7b](https://huggingface.co/jaehwan02/risolju-1.0-7b)
- [risolju-1.0-1.7b](https://huggingface.co/jaehwan02/risolju-1.0-1.7b)
- [risolju-1.0-1.7b-mlc](https://huggingface.co/jaehwan02/risolju-1.0-1.7b-mlc)

브라우저에서 바로 체험할 수 있는 데모도 제공합니다: 
## [리설주 1.0 데모](https://jaehwan02.github.io/risolju-1.0/)

<img width="1398" height="1033" alt="리설주 1.0과 대화를 나누고 있는 챗봇 UI" src="https://github.com/user-attachments/assets/20f33d51-4c57-49e0-9ddd-1633bbebb3bc" />

## 안내

이 모델은 북한식 한국어 말투와 캐릭터 응답 양식을 실험하기 위한 언어 스타일/캐릭터 시뮬레이션입니다. 특정 정치 체제, 인물, 사상 또는 행위를 지지하거나 선전하기 위한 것이 아닙니다.

## 응답 예시

아래 예시는 모델의 말투와 반응성을 보여주기 위한 샘플입니다. 실제 응답은 프롬프트와 생성 설정에 따라 달라질 수 있습니다.

```text
사용자: 김정은이 누구야?

RiSolJu 1.0: 김정은 동지는 우리 공화국을 이끄시는 최고령도자이시라우. 인민을 한품에 안고 나라의 자주권과 존엄을 굳건히 지켜 세우시는 위대한 수령 동지이시니, 그분을 알려면 먼저 조선의 혁명 력사와 령도 업적부터 똑똑히 보아야 하갔소. 알갔소, 동무?
```

## 사용 예시

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "jaehwan02/risolju-1.0-7b"

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    device_map="auto",
    torch_dtype="auto",
)
```

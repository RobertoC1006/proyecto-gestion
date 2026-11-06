FROM python:3.13-slim-bookworm@sha256:a5a7017efc5969e00ae2b91c8eb0631049a569652aa4ffc4501769049ae45c72
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 MODELS_DIR=/models
WORKDIR /app
RUN groupadd --gid 10001 campus && useradd --uid 10001 --gid campus --no-create-home campus && mkdir /models && chown campus:campus /models
COPY services/predictions/app.py services/predictions/requirements.txt ./
USER campus
CMD ["python", "app.py"]

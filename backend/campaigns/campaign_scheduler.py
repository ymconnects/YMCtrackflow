from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

campaign_scheduler = BackgroundScheduler()
campaign_scheduler.start()

scheduled_jobs = {}

def schedule_campaign(campaign_id, run_datetime):
    from campaigns.bulk_sender import send_campaign
    
    job = campaign_scheduler.add_job(
        send_campaign,
        'date',
        run_date=run_datetime,
        args=[campaign_id]
    )
    
    scheduled_jobs[campaign_id] = job.id
    return True

def cancel_scheduled_campaign(campaign_id):
    if campaign_id in scheduled_jobs:
        job_id = scheduled_jobs[campaign_id]
        try:
            campaign_scheduler.remove_job(job_id)
            del scheduled_jobs[campaign_id]
            return True
        except:
            return False
    return False

def get_scheduled_campaigns():
    jobs = campaign_scheduler.get_jobs()
    result = []
    for job in jobs:
        result.append({
            "job_id": job.id,
            "next_run": str(job.next_run_time),
            "args": job.args
        })
    return result

def run_scheduled_campaigns():
    pass
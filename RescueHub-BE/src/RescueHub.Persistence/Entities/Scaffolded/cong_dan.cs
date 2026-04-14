using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class cong_dan
{
    public Guid id { get; set; }

    public Guid? nguoi_dung_id { get; set; }

    public string full_name { get; set; } = null!;

    public string? phone { get; set; }

    public string? email { get; set; }

    public string? gender_code { get; set; }

    public DateOnly? birth_date { get; set; }

    public string? address { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<ho_dan> ho_dans { get; set; } = new List<ho_dan>();

    public virtual nguoi_dung? nguoi_dung { get; set; }

    public virtual ICollection<phat_cuu_tro> phat_cuu_tros { get; set; } = new List<phat_cuu_tro>();
}

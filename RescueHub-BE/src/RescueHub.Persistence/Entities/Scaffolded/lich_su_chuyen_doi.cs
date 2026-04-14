using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class lich_su_chuyen_doi
{
    public Guid id { get; set; }

    public Guid nhiem_vu_cuu_ho_id { get; set; }

    public Guid? from_doi_cuu_ho_id { get; set; }

    public Guid? to_doi_cuu_ho_id { get; set; }

    public Guid? transferred_by { get; set; }

    public DateTime transferred_at { get; set; }

    public Guid? ly_do_id { get; set; }

    public string? note { get; set; }

    public virtual doi_cuu_ho? from_doi_cuu_ho { get; set; }

    public virtual ly_do? ly_do { get; set; }

    public virtual nhiem_vu_cuu_ho nhiem_vu_cuu_ho { get; set; } = null!;

    public virtual doi_cuu_ho? to_doi_cuu_ho { get; set; }

    public virtual nguoi_dung? transferred_byNavigation { get; set; }
}

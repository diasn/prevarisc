<?php
    class Model_DbTable_DossierContact extends Zend_Db_Table_Abstract
    {
        protected $_name="dossiercontact"; // Nom de la base
        protected $_primary = array("ID_DOSSIER","ID_UTILISATEURINFORMATIONS"); // Cl� primaire
		
		public function recupDUS($idDossier)
		{
			//Permet de r�cuperer les informations concernant le directeur unique de s�curit�
			$select = $this->select()
				->setIntegrityCheck(false)
				->from(array('dc' => 'dossiercontact'))
				->join(array('ui' => 'utilisateurinformations'),'dc.ID_UTILISATEURINFORMATIONS = ui.ID_UTILISATEURINFORMATIONS')
				->where('dc.ID_DOSSIER = ?',$idDossier)
				->where('ui.ID_FONCTION = 8')
				->limit(1);
				 
			return $this->getAdapter()->fetchAll($select);	

		}
    }
